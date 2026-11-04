"use client";

import React, { useState } from "react";
import {
  AIQueryResponse,
  DocumentRecord,
  Organisation,
} from "@/types/newsroom";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileUp,
  Quote,
  FileText,
} from "lucide-react";

interface AICopilotViewProps {
  documents: DocumentRecord[];
  organisations: Organisation[];
  activeOrgId: string;
  onDocumentIndexed: (
    newState: Record<string, unknown>,
    doc: DocumentRecord
  ) => void;
  onLogAIQuery: (docTitle: string, mode: string, query: string) => void;
  onLogHumanVerification: (docTitle: string, pageNumber: number) => void;
  onInsertCitationIntoDraft?: (citationText: string) => void;
}

const PRESET_QUERIES = [
  "What lithium and sulphate levels were measured downstream of Tailings Dam #2?",
  "When was the $1,420,000 chemical contract awarded and at what price markup?",
  "What did community members allege about night-time sluice valve discharges?",
];

export default function AICopilotView({
  documents,
  organisations,
  activeOrgId,
  onDocumentIndexed,
  onLogAIQuery,
  onLogHumanVerification,
  onInsertCitationIntoDraft,
}: AICopilotViewProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>("doc-ema-audit");
  const [query, setQuery] = useState<string>(PRESET_QUERIES[0]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [highlightedPage, setHighlightedPage] = useState<number | null>(14);
  const [verifiedPages, setVerifiedPages] = useState<Record<string, boolean>>(
    {}
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadExcerpt, setUploadExcerpt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [uploadConsent, setUploadConsent] = useState<
    "Approved for Cloud & Local AI" | "Local Inference Only (Confidential)"
  >("Approved for Cloud & Local AI");

  React.useEffect(() => {
    const saved = window.localStorage.getItem("cn_gemini_api_key");
    if (saved) setGeminiApiKey(saved);
  }, []);

  const [aiResult, setAiResult] = useState<AIQueryResponse | null>({
    id: "ai-initial",
    query: PRESET_QUERIES[0],
    modelUsed: "Connected Newsroom Grounded Research Assistant",
    inferenceMode: "Gemini Server-Side API (Approved Public Doc)",
    answerSummary:
      'Official EMA laboratory tests on 14 August 2026 recorded dissolved lithium concentrations of 4.8 mg/L and sulphate levels of 1,120 mg/L at 400 metres downstream of Tailings Dam #2—exceeding the statutory Red-Class effluent limit by 340% [Page 14]. Inspectors also documented a 12-metre tear in the HDPE liner on 02 September 2026 [Page 21].',
    evidenceFindings: [
      "[Page 14 — Laboratory Effluent Analysis] Dissolved lithium concentrations of 4.8 mg/L and sulphate levels of 1,120 mg/L, exceeding the statutory Red-Class effluent threshold by 340%.",
      "[Page 21 — Geomembrane Liner Breach] 12-metre tear in the HDPE liner on Tailings Dam #2; Compliance Order #EMA-BYO-882 issued on 02 September 2026.",
    ],
    allegationsToVerify: [
      "[Page 29 — Unverified Allegation] Three ward councillors alleged sluice valves were manually opened between 23:00 and 03:00 on 19 October 2026; automated flow-meter logs were missing.",
    ],
    humanVerificationChecklist: [
      "Inspect Page 14 and Page 21 in the original document viewer on the right.",
      "Click 'Add Quote & Citation to Story' once verified.",
    ],
    citations: [
      {
        documentId: "doc-ema-audit",
        documentTitle:
          "2026 Auditor-General & EMA Joint Inspection Report: Umzingwane Catchment",
        pageNumber: 14,
        sectionTitle: "Section 3.2 — Laboratory Effluent Analysis at Weir #3",
        exactQuote:
          "Water samples collected on 14 August 2026 at 400 metres downstream of Tailings Dam #2 recorded dissolved lithium concentrations of 4.8 mg/L and sulphate levels of 1,120 mg/L, exceeding the statutory Red-Class effluent threshold by 340%.",
        classification: "Documented Evidence",
      },
    ],
    timestamp: "2026-11-04 12:00",
  });

  const selectedDoc =
    documents.find((d) => d.id === selectedDocId) || documents[0];
  const hasAccessToSelected = selectedDoc.allowedOrgIds.includes(activeOrgId);

  const runResearchQuery = async (
    targetDocId?: string,
    customQuery?: string
  ) => {
    const docIdToUse = targetDocId || selectedDocId;
    const qToUse = customQuery || query;
    const docObj = documents.find((d) => d.id === docIdToUse);

    setLoading(true);
    setErrorBanner(null);

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: qToUse,
          documentId: docIdToUse,
          activeOrgId,
          customDocument: docObj,
          apiKey: geminiApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || "Permission denied for this document.");
        setLoading(false);
        return;
      }

      setAiResult(data);
      if (data.citations?.[0]?.pageNumber) {
        setHighlightedPage(data.citations[0].pageNumber);
      }
      onLogAIQuery(
        docObj?.title || docIdToUse,
        data.inferenceMode,
        qToUse.slice(0, 60)
      );
    } catch (e) {
      setErrorBanner(
        e instanceof Error ? e.message : "Failed to run grounded AI query."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !uploadExcerpt.trim()) return;

    setUploading(true);
    setErrorBanner(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      formData.append("title", uploadTitle.trim());
      formData.append("rawText", uploadExcerpt.trim());
      formData.append("activeOrgId", activeOrgId);
      formData.append("investigationId", "inv-umzingwane");
      formData.append("documentType", "Public Audit Report");
      formData.append("aiConsentStatus", uploadConsent);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || "File parsing failed.");
        setUploading(false);
        return;
      }

      onDocumentIndexed(data.state, data.document);
      setSelectedDocId(data.document.id);
      setShowUploadModal(false);
      setUploadTitle("");
      setUploadExcerpt("");
      setSelectedFile(null);
      setQuery("Summarize the key findings, dates, and entities in this document");
      await runResearchQuery(
        data.document.id,
        "Summarize the key findings, dates, and entities in this document"
      );
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Clean Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              AI Document Research & Source Verification
            </h2>
            <p className="text-xs text-slate-400">
              Select a source document below, ask a question, and inspect exact page quotes before citing in your story.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => {
              setGeminiApiKey(e.target.value);
              window.localStorage.setItem("cn_gemini_api_key", e.target.value);
            }}
            placeholder="Paste GEMINI_API_KEY..."
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-400 w-48"
          />
          <button
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow shrink-0"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <form
          onSubmit={handleUploadSubmit}
          className="p-5 rounded-2xl border border-teal-500/40 bg-slate-900/95 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileUp className="w-4 h-4 text-teal-400" />
              Add Primary Source Document to Investigation
            </h4>
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Choose File (.pdf, .png/.jpg OCR, .txt, .csv)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setSelectedFile(f);
                  if (f && !uploadTitle) {
                    setUploadTitle(f.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-500 file:text-slate-950"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., ZINWA Water Lab Certificate #408"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Privacy & AI Processing Mode
              </label>
              <select
                value={uploadConsent}
                onChange={(e) =>
                  setUploadConsent(
                    e.target.value as
                      | "Approved for Cloud & Local AI"
                      | "Local Inference Only (Confidential)"
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              >
                <option value="Local Inference Only (Confidential)">
                  Private / Confidential (Local Model Only)
                </option>
                <option value="Approved for Cloud & Local AI">
                  Public Report (Cloud & Local AI Allowed)
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Or Paste Document Text directly
            </label>
            <textarea
              rows={3}
              value={uploadExcerpt}
              onChange={(e) => setUploadExcerpt(e.target.value)}
              placeholder="Paste paragraphs from a report or interview transcript..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {uploading ? "Indexing Document..." : "Upload & Index Document"}
            </button>
          </div>
        </form>
      )}

      {/* Clean Document Selector Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {documents.map((doc) => {
          const isAllowed = doc.allowedOrgIds.includes(activeOrgId);
          const isSelected = doc.id === selectedDocId;
          const ownerOrg = organisations.find((o) => o.id === doc.sourceOrgId);

          return (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedDocId(doc.id);
                setErrorBanner(null);
                if (!isAllowed) {
                  runResearchQuery(doc.id, "Attempt cross-organisation query");
                } else {
                  const defaultQ =
                    doc.id === "doc-procurement-ledger"
                      ? PRESET_QUERIES[1]
                      : PRESET_QUERIES[0];
                  setQuery(defaultQ);
                  runResearchQuery(doc.id, defaultQ);
                }
              }}
              className={`text-left p-4 rounded-2xl border transition flex flex-col justify-between gap-3 cursor-pointer ${
                isSelected
                  ? "bg-slate-900 border-teal-500 shadow-lg"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-teal-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {doc.documentType}
                  </span>
                  {isAllowed ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">
                      Shared
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Private to {ownerOrg?.shortName}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">
                  {doc.title}
                </h4>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Source: {ownerOrg?.shortName}</span>
                <span>{doc.pageCount} pages</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 403 Permission Block Banner */}
      {errorBanner && (
        <div className="p-4 rounded-2xl border border-rose-500/50 bg-rose-950/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-200">
              Restricted Document — Access Blocked
            </h4>
            <p className="text-xs text-rose-300">{errorBanner}</p>
          </div>
        </div>
      )}

      {/* Main Split Workspace: Left = Question & Grounded Answer | Right = Original Document Passages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Columns */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-3.5">
            <label className="block text-sm font-bold text-white">
              Ask a question about “{selectedDoc.title}”
            </label>

            <div className="flex gap-2.5">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about specific dates, lab numbers, contracts, or people..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-teal-400"
              />
              <button
                onClick={() => runResearchQuery()}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow"
              >
                <Search className="w-4 h-4" />
                {loading ? "Searching..." : "Ask Copilot"}
              </button>
            </div>

            {/* Suggested Questions */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-slate-400">
                Try a suggested question:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUERIES.map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(pq);
                      const targetDoc =
                        idx === 1 ? "doc-procurement-ledger" : "doc-ema-audit";
                      setSelectedDocId(targetDoc);
                      runResearchQuery(targetDoc, pq);
                    }}
                    className="text-left text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 transition cursor-pointer"
                  >
                    “{pq}”
                  </button>
                ))}
              </div>
            </div>
          </div>

          {aiResult && hasAccessToSelected && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Source-Grounded Answer
                </h4>
                <span className="text-xs text-slate-400">
                  {aiResult.inferenceMode}
                </span>
              </div>

              <p className="text-sm text-slate-100 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                {aiResult.answerSummary}
              </p>

              {/* Evidence vs Allegations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Documented Evidence
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
                    {aiResult.evidenceFindings.map((ef, i) => (
                      <li key={i}>• {ef}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/15 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    Unverified Allegations (Needs Corroboration)
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
                    {aiResult.allegationsToVerify.map((al, i) => (
                      <li key={i}>• {al}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Original Source Pages */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  Original Document Passages
                </h4>
                <p className="text-xs text-slate-400">
                  Verify exact wording & add citation to your story draft
                </p>
              </div>
            </div>
          </div>

          {!hasAccessToSelected ? (
            <div className="p-10 text-center space-y-2 my-auto">
              <Lock className="w-8 h-8 text-rose-400 mx-auto" />
              <div className="text-sm font-bold text-slate-200">
                Document Locked
              </div>
              <p className="text-xs text-slate-400">
                Your active newsroom does not have permission to read this file.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
              {selectedDoc.passages.map((pas) => {
                const isHighlighted = highlightedPage === pas.pageNumber;
                const verifyKey = `${selectedDoc.id}-${pas.pageNumber}`;
                const isVerified = verifiedPages[verifyKey];

                return (
                  <div
                    key={pas.id}
                    onClick={() => setHighlightedPage(pas.pageNumber)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-3 ${
                      isHighlighted
                        ? "border-teal-400 bg-teal-950/20 shadow-md"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-teal-300">
                        Page {pas.pageNumber} • {pas.sectionTitle}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          pas.classification === "Documented Evidence"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {pas.classification}
                      </span>
                    </div>

                    <blockquote className="text-xs text-slate-100 leading-relaxed border-l-2 border-teal-500 pl-3 py-1 bg-slate-950/50 rounded-r">
                      “{pas.quote}”
                    </blockquote>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70">
                      {onInsertCitationIntoDraft && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInsertCitationIntoDraft(
                              `${pas.quote} [Citation: ${selectedDoc.title}, p. ${pas.pageNumber}]`
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Quote className="w-3.5 h-3.5" />+ Add Quote & Cite in Story
                        </button>
                      )}

                      {isVerified ? (
                        <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Verified by Journalist
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVerifiedPages((prev) => ({
                              ...prev,
                              [verifyKey]: true,
                            }));
                            onLogHumanVerification(
                              selectedDoc.title,
                              pas.pageNumber
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                        >
                          Mark Verified ✓
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
