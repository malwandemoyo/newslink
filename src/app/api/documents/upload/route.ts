import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import zlib from "node:zlib";
import Tesseract from "tesseract.js";
import {
  getCollection,
  setCollection,
  insertAuditLog,
  getFullWorkspaceState,
} from "@/lib/db";
import { INITIAL_DOCUMENTS } from "@/data/seed";
import {
  ClaimClassification,
  DocumentPassage,
  DocumentRecord,
} from "@/types/newsroom";

function extractTextFromPdfBuffer(buf: Buffer): string {
  const rawLatin = buf.toString("latin1");
  const extractedChunks: string[] = [];

  // 1. Decompress FlateDecode PDF streams where possible
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(rawLatin)) !== null) {
    try {
      const streamBuf = Buffer.from(match[1], "latin1");
      const inflated = zlib.inflateSync(streamBuf).toString("latin1");
      const textMatches = inflated.match(/\(([^()]{3,})\)/g);
      if (textMatches) {
        extractedChunks.push(
          textMatches
            .map((t) => t.slice(1, -1).replace(/\\[nrt]/g, " "))
            .join(" ")
        );
      }
    } catch {
      // Non-zlib stream or image stream; ignore
    }
  }

  // 2. Also scan direct parenthesis text blocks in uncompressed PDF content
  const directMatches = rawLatin.match(/\(([^()\\]{4,})\)/g);
  if (directMatches) {
    extractedChunks.push(
      directMatches
        .map((t) => t.slice(1, -1))
        .filter((s) => /[a-zA-Z]{3,}/.test(s) && !/^(Type|Font|Page|Obj)/.test(s))
        .join(" ")
    );
  }

  const combined = extractedChunks.join("\n\n").replace(/\s+/g, " ").trim();
  return combined;
}

function classifyPassage(text: string): ClaimClassification {
  const lower = text.toLowerCase();
  if (
    lower.includes("alleg") ||
    lower.includes("claim") ||
    lower.includes("rumour") ||
    lower.includes("unverified") ||
    lower.includes("anonymous tip") ||
    lower.includes("heard that")
  ) {
    return "Unverified Allegation";
  }
  if (
    lower.includes("infer") ||
    lower.includes("flag") ||
    lower.includes("suggests") ||
    lower.includes("potential")
  ) {
    return "Analytical Inference";
  }
  return "Documented Evidence";
}

function extractEntitiesAndDates(text: string) {
  const dateMatches =
    text.match(
      /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{4}-\d{2}-\d{2})\b/gi
    ) || [];

  const orgMatches =
    text.match(
      /\b([A-Z][A-Za-z0-9&.\-]+(?:\s+[A-Z][A-Za-z0-9&.\-]+){0,4}\s+(?:Ltd|Pvt|Council|Agency|Authority|Ministry|Collective|Corporation|Holdings|Committee|Bank|Department))\b/g
    ) || [];

  const peopleMatches =
    text.match(
      /\b((?:Eng\.|Dr\.|Adv\.|Mr\.|Ms\.|Prof\.|Director|Inspector|Councillor)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g
    ) || [];

  return {
    dates: Array.from(new Set(dateMatches)).slice(0, 6),
    organisations: Array.from(new Set(orgMatches)).slice(0, 6),
    people: Array.from(new Set(peopleMatches)).slice(0, 6),
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let fileName = "uploaded_evidence.txt";
    let rawText = "";
    let activeOrgId = "org-byo";
    let investigationId = "inv-umzingwane";
    let documentType: DocumentRecord["documentType"] = "Public Audit Report";
    let aiConsentStatus: DocumentRecord["aiConsentStatus"] =
      "Local Inference Only (Confidential)";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = (formData.get("title") as string) || "";
      activeOrgId = (formData.get("activeOrgId") as string) || "org-byo";
      investigationId =
        (formData.get("investigationId") as string) || "inv-umzingwane";
      documentType =
        ((formData.get("documentType") as string) as DocumentRecord["documentType"]) ||
        "Public Audit Report";
      aiConsentStatus =
        ((formData.get("aiConsentStatus") as string) as DocumentRecord["aiConsentStatus"]) ||
        "Local Inference Only (Confidential)";
      const fallbackText = (formData.get("rawText") as string) || "";

      if (file) {
        fileName = file.name;
        if (!title) {
          title = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        }
        const arrayBuffer = await file.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        const lowerName = file.name.toLowerCase();

        if (
          lowerName.endsWith(".png") ||
          lowerName.endsWith(".jpg") ||
          lowerName.endsWith(".jpeg") ||
          lowerName.endsWith(".webp") ||
          lowerName.endsWith(".bmp")
        ) {
          try {
            const ocrResult = await Tesseract.recognize(buf, "eng");
            rawText =
              ocrResult.data.text?.trim() ||
              fallbackText ||
              `Tesseract.js OCR processed image ${file.name}.`;
          } catch {
            rawText =
              fallbackText || `Tesseract.js OCR fallback for ${file.name}.`;
          }
        } else if (lowerName.endsWith(".pdf")) {
          const pdfText = extractTextFromPdfBuffer(buf);
          rawText =
            pdfText.length > 40
              ? pdfText
              : fallbackText ||
                `Extracted PDF binary stream (${buf.length} bytes) from ${file.name}.`;
        } else {
          rawText = buf.toString("utf-8");
        }
      } else {
        rawText = fallbackText;
      }
    } else {
      const body = await req.json();
      title = body.title || "Uploaded Evidence Document";
      fileName = body.fileName || "evidence_notes.txt";
      rawText = body.rawText || "";
      activeOrgId = body.activeOrgId || "org-byo";
      investigationId = body.investigationId || "inv-umzingwane";
      documentType = body.documentType || "Public Audit Report";
      aiConsentStatus =
        body.aiConsentStatus || "Local Inference Only (Confidential)";
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "No readable text found in document upload." },
        { status: 400 }
      );
    }

    // Split text into logical passages (by double newline or ~420 char chunks)
    const rawParagraphs = rawText
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 20);

    const chunks: string[] = [];
    if (rawParagraphs.length > 0) {
      for (const para of rawParagraphs) {
        if (para.length <= 500) {
          chunks.push(para);
        } else {
          const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
          let current = "";
          for (const s of sentences) {
            if ((current + " " + s).length > 450 && current.length > 0) {
              chunks.push(current.trim());
              current = s;
            } else {
              current += " " + s;
            }
          }
          if (current.trim()) chunks.push(current.trim());
        }
      }
    } else {
      chunks.push(rawText.trim().slice(0, 600));
    }

    const allExtracted = extractEntitiesAndDates(rawText);
    const passages: DocumentPassage[] = chunks.slice(0, 15).map((chunk, idx) => {
      const chunkEnt = extractEntitiesAndDates(chunk);
      return {
        id: `pas-${Date.now()}-${idx}`,
        pageNumber: idx + 1,
        sectionTitle: `Extracted Passage #${idx + 1} (${fileName})`,
        quote: chunk,
        classification: classifyPassage(chunk),
        entities: [
          ...chunkEnt.organisations,
          ...chunkEnt.people,
        ].slice(0, 4),
        dates:
          chunkEnt.dates.length > 0 ? chunkEnt.dates : ["November 2026"],
      };
    });

    const commitHash = crypto
      .createHash("sha1")
      .update(`${fileName}-${Date.now()}-${rawText.slice(0, 200)}`)
      .digest("hex")
      .slice(0, 7);

    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      investigationId,
      title: title.trim() || fileName,
      fileName,
      commitHash,
      sourceOrgId: activeOrgId,
      allowedOrgIds: Array.from(
        new Set([activeOrgId, "org-byo", "org-cite", "org-hre"])
      ),
      documentType,
      pageCount: passages.length,
      uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      aiConsentStatus,
      summary: `Committed file '${fileName}' (SHA ${commitHash}) with ${passages.length} indexed passage(s).`,
      extractedEntities: {
        people:
          allExtracted.people.length > 0
            ? allExtracted.people
            : ["Primary Source Signatory"],
        organisations:
          allExtracted.organisations.length > 0
            ? allExtracted.organisations
            : ["Participating Newsroom Desk"],
        locations: ["Umzingwane / Bulawayo Corridor"],
        keyDates:
          allExtracted.dates.length > 0
            ? allExtracted.dates
            : [new Date().toISOString().slice(0, 10)],
      },
      passages,
    };

    const existingDocs = getCollection<DocumentRecord[]>(
      "documents",
      INITIAL_DOCUMENTS
    );
    setCollection("documents", [newDoc, ...existingDocs]);

    insertAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actorName: `Editor (${activeOrgId})`,
      actorOrgId: activeOrgId,
      category: "Evidence Commit",
      action: `Committed & parsed file '${fileName}' (${passages.length} passages, SHA ${commitHash})`,
      resourceTarget: newDoc.id,
    });

    return NextResponse.json({
      document: newDoc,
      state: getFullWorkspaceState(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
