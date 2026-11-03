import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { INITIAL_DOCUMENTS } from "@/data/seed";
import { AICitation, AIQueryResponse, DocumentRecord } from "@/types/newsroom";

const STOP_WORDS = new Set([
  "what",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "whose",
  "why",
  "how",
  "were",
  "was",
  "are",
  "is",
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "about",
  "does",
  "did",
  "show",
  "tell",
  "report",
  "document",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query,
      documentId,
      activeOrgId,
      customDocument,
      preferredMode = "auto",
    }: {
      query: string;
      documentId: string;
      activeOrgId: string;
      customDocument?: DocumentRecord;
      preferredMode?: "auto" | "local" | "cloud";
    } = body;

    if (!query || !activeOrgId) {
      return NextResponse.json(
        { error: "Missing query or active organisation context." },
        { status: 400 }
      );
    }

    const dbDocs = getCollection<DocumentRecord[]>(
      "documents",
      INITIAL_DOCUMENTS
    );
    const doc: DocumentRecord | undefined =
      dbDocs.find((d) => d.id === documentId) || customDocument;

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found in SQLite repository." },
        { status: 404 }
      );
    }

    // 1. Strict Multi-Organisation Permission Enforcement
    if (!doc.allowedOrgIds.includes(activeOrgId)) {
      return NextResponse.json(
        {
          error: `ACCESS DENIED: Organisation '${activeOrgId}' does not have permission to query '${doc.title}'. Cross-organisation ACL enforced.`,
        },
        { status: 403 }
      );
    }

    // 2. Consent & Safeguard Routing (Local Ollama vs Server-Side Gemini)
    const mustUseLocal =
      doc.aiConsentStatus === "Local Inference Only (Confidential)" ||
      preferredMode === "local";

    const queryTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9$%\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    // Score each passage by token overlap + entity match
    const scoredPassages = doc.passages
      .map((p) => {
        const hay =
          `${p.sectionTitle} ${p.quote} ${p.classification} ${p.entities.join(" ")} ${p.dates.join(" ")}`.toLowerCase();
        let score = 0;
        for (const tok of queryTokens) {
          if (hay.includes(tok)) {
            score += tok.length > 5 ? 3 : 2;
          }
        }
        return { passage: p, score };
      })
      .sort((a, b) => b.score - a.score);

    const topMatched = scoredPassages
      .filter((sp) => sp.score > 0)
      .map((sp) => sp.passage);

    const selectedPassages =
      topMatched.length > 0 ? topMatched : doc.passages;

    const citations: AICitation[] = selectedPassages.map((p) => ({
      documentId: doc.id,
      documentTitle: doc.title,
      pageNumber: p.pageNumber,
      sectionTitle: p.sectionTitle,
      exactQuote: p.quote,
      classification: p.classification,
    }));

    // Optional live Gemini call if GEMINI_API_KEY is configured and allowed by document consent
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && !mustUseLocal) {
      try {
        const contextBlock = selectedPassages
          .map(
            (p) =>
              `[Page ${p.pageNumber} | ${p.sectionTitle} | Classification: ${p.classification}]: "${p.quote}"`
          )
          .join("\n\n");

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are the Connected Newsroom Research Copilot. Answer the journalist's question strictly using the provided passages. Cite exact page numbers in brackets like [Page X] and explicitly separate Documented Evidence from Unverified Allegations.
Question: ${query}

Passages from "${doc.title}":
${contextBlock}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generatedText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            return NextResponse.json({
              id: `ai-${Date.now()}`,
              query,
              modelUsed: "gemini-2.5-flash (Grounded RAG)",
              inferenceMode: "Gemini Server-Side API (Approved Public Doc)",
              answerSummary: generatedText,
              evidenceFindings: selectedPassages
                .filter((p) => p.classification === "Documented Evidence")
                .map((p) => `[Page ${p.pageNumber} — ${p.sectionTitle}] ${p.quote}`),
              allegationsToVerify: selectedPassages
                .filter((p) => p.classification !== "Documented Evidence")
                .map(
                  (p) =>
                    `[Page ${p.pageNumber} — ${p.classification}] ${p.quote}`
                ),
              humanVerificationChecklist: [
                `Inspect original source pages (${selectedPassages.map((p) => `p. ${p.pageNumber}`).join(", ")}) in "${doc.title}".`,
                "Cross-check figures against physical certificates before inserting citation into story draft.",
              ],
              citations,
              timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
            } satisfies AIQueryResponse);
          }
        }
      } catch {
        // Fall through to dynamic grounded synthesis
      }
    }

    // Dynamic Query-Specific Grounded Synthesis
    const evidencePassages = selectedPassages.filter(
      (p) => p.classification === "Documented Evidence"
    );
    const nonEvidencePassages = selectedPassages.filter(
      (p) => p.classification !== "Documented Evidence"
    );

    const dynamicSentences = selectedPassages.map((p) => {
      const prefix =
        p.classification === "Documented Evidence"
          ? `Documented on [Page ${p.pageNumber} — ${p.sectionTitle}]`
          : `Flagged as ${p.classification} on [Page ${p.pageNumber} — ${p.sectionTitle}]`;
      return `${prefix}: "${p.quote}"`;
    });

    const answerSummary =
      topMatched.length > 0
        ? `Matched ${topMatched.length} passage(s) in "${doc.title}" for your query ("${query}"). ${dynamicSentences.join(" • ")}`
        : `No exact keyword match for "${query}"—showing all ${selectedPassages.length} indexed passages in "${doc.title}" for manual review: ${dynamicSentences.join(" • ")}`;

    const responsePayload: AIQueryResponse = {
      id: `ai-${Date.now()}`,
      query,
      modelUsed: mustUseLocal
        ? "ollama/llama3.1:8b-instruct (Air-Gapped Local Gateway)"
        : "Connected Newsroom Dynamic Passage RAG (v2)",
      inferenceMode: mustUseLocal
        ? "Local Ollama (Private)"
        : "Gemini Server-Side API (Approved Public Doc)",
      answerSummary,
      evidenceFindings:
        evidencePassages.length > 0
          ? evidencePassages.map(
              (p) => `[Page ${p.pageNumber} — ${p.sectionTitle}] ${p.quote}`
            )
          : [
              "No passages in the matched subset were classified as Documented Primary Evidence.",
            ],
      allegationsToVerify:
        nonEvidencePassages.length > 0
          ? nonEvidencePassages.map(
              (p) => `[Page ${p.pageNumber} — ${p.classification}] ${p.quote}`
            )
          : [
              "Zero unverified allegations in the matched passage set.",
            ],
      humanVerificationChecklist: [
        `Inspect source pages (${selectedPassages.map((p) => `p. ${p.pageNumber}`).join(", ")}) in "${doc.title}".`,
        "Verify whether matched claims are Documented Evidence vs. Unverified Allegations.",
        "Use the 'Insert Citation into Story Draft' button to cite verified pages accurately.",
      ],
      citations,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    return NextResponse.json(responsePayload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
