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
      apiKey,
    }: {
      query: string;
      documentId: string;
      activeOrgId: string;
      customDocument?: DocumentRecord;
      apiKey?: string;
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
        { error: "Document not found in repository." },
        { status: 404 }
      );
    }

    if (!doc.allowedOrgIds.includes(activeOrgId)) {
      return NextResponse.json(
        {
          error: `ACCESS DENIED: Organisation '${activeOrgId}' does not have permission to query '${doc.title}'.`,
        },
        { status: 403 }
      );
    }

    const queryTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9$%\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

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

    const geminiApiKey = (apiKey || process.env.GEMINI_API_KEY || "").trim();
    const geminiModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    if (geminiApiKey) {
      const contextBlock = selectedPassages
        .map(
          (p) =>
            `[Page ${p.pageNumber} | ${p.sectionTitle} | Classification: ${p.classification}]: "${p.quote}"`
        )
        .join("\n\n");

      const promptText = `You are the Connected Newsroom Research Copilot. Answer the journalist's question strictly using the provided passages. Cite exact page numbers in brackets like [Page X] and explicitly separate Documented Evidence from Unverified Allegations.
Question: ${query}

Passages from "${doc.title}":
${contextBlock}`;

      const candidateUrls = [
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
        `https://aiplatform.googleapis.com/v1/publishers/google/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      ];

      for (const endpointUrl of candidateUrls) {
        try {
          const geminiRes = await fetch(endpointUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: promptText }],
                },
              ],
            }),
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const generatedText =
              geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText) {
              return NextResponse.json({
                id: `ai-${Date.now()}`,
                query,
                modelUsed: `${geminiModel} (Vertex / Gemini API)`,
                inferenceMode: "Gemini Server-Side API (Approved Public Doc)",
                answerSummary: generatedText,
                evidenceFindings: selectedPassages
                  .filter((p) => p.classification === "Documented Evidence")
                  .map(
                    (p) =>
                      `[Page ${p.pageNumber} — ${p.sectionTitle}] ${p.quote}`
                  ),
                allegationsToVerify: selectedPassages
                  .filter((p) => p.classification !== "Documented Evidence")
                  .map(
                    (p) =>
                      `[Page ${p.pageNumber} — ${p.classification}] ${p.quote}`
                  ),
                humanVerificationChecklist: [
                  `Inspect source pages (${selectedPassages.map((p) => `p. ${p.pageNumber}`).join(", ")}) in "${doc.title}".`,
                  "Cross-check figures against primary records before inserting citation into story draft.",
                ],
                citations,
                timestamp: new Date()
                  .toISOString()
                  .slice(0, 16)
                  .replace("T", " "),
              } satisfies AIQueryResponse);
            }
          }
        } catch {
          // Try next endpoint or fall back
        }
      }
    }

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
        ? `Matched ${topMatched.length} passage(s) in "${doc.title}": ${dynamicSentences.join(" • ")}`
        : `Showing ${selectedPassages.length} indexed passages in "${doc.title}": ${dynamicSentences.join(" • ")}`;

    const responsePayload: AIQueryResponse = {
      id: `ai-${Date.now()}`,
      query,
      modelUsed: `${geminiModel} (Grounded Index — Set GEMINI_API_KEY for Live LLM)`,
      inferenceMode: "Gemini Server-Side API (Approved Public Doc)",
      answerSummary,
      evidenceFindings:
        evidencePassages.length > 0
          ? evidencePassages.map(
              (p) => `[Page ${p.pageNumber} — ${p.sectionTitle}] ${p.quote}`
            )
          : ["No passages matched as Documented Evidence."],
      allegationsToVerify:
        nonEvidencePassages.length > 0
          ? nonEvidencePassages.map(
              (p) => `[Page ${p.pageNumber} — ${p.classification}] ${p.quote}`
            )
          : ["Zero unverified allegations in matched passages."],
      humanVerificationChecklist: [
        `Inspect source pages (${selectedPassages.map((p) => `p. ${p.pageNumber}`).join(", ")}) in "${doc.title}".`,
        "Use '+ Add Quote & Cite in Story' to insert verified passages.",
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
