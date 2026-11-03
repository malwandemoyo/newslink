"use client";

import React, { useState } from "react";
import {
  AIQueryResponse,
  DocumentRecord,
  Organisation,
} from "@/types/newsroom";
import {
  FileText,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Eye,
} from "lucide-react";

interface AICopilotViewProps {
  documents: DocumentRecord[];
  organisations: Organisation[];
  activeOrgId: string;
  onUploadDocument: (doc: DocumentRecord) => void;
  onLogAIQuery: (docTitle: string, mode: string, query: string) => void;
  onLogHumanVerification: (docTitle: string, pageNumber: number) => void;
}

const PRESET_QUERIES = [
  "What laboratory lithium and sulphate levels were recorded downstream of Tailings Dam #2, and on which pages?",
  "When was the $1.42M emergency water chemical contract awarded relative to the EMA Compliance Order?",
  "Which claims in the report are unverified community allegations versus documented laboratory evidence?",
];

export default function AICopilotView({
  documents,
  organisations,
  activeOrgId,
  onUploadDocument,
  onLogAIQuery,
  onLogHumanVerification,
}: AICopilotViewProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>("doc-ema-audit");
  const [query, setQuery] = useState<string>(PRESET_QUERIES[0]);
  const [inferencePreference, setInferencePreference] = useState<
    "auto" | "local" | "cloud"
  >("auto");
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [highlightedPage, setHighlightedPage] = useState<number | null>(14);
  const [verifiedPages, setVerifiedPages] = useState<Record<string, boolean>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadExcerpt, setUploadExcerpt] = useState("");
  const [uploadConsent, setUploadConsent] = useState<
    "Approved for Cloud & Local AI" | "Local Inference Only (Confidential)"
  >("Local Inference Only (Confidential)");

  const [aiResult, setAiResult] = useState<AIQueryResponse | null>({
    id: "ai-initial",
    query: PRESET_QUERIES[0],
    modelUsed: "Connected Newsroom Grounded RAG Engine (v1)",
    inferenceMode: "Gemini Server-Side API (Approved Public Doc)",
    answerSummary:
      'Based on retrieved passages in "2026 Auditor-General & EMA Joint Inspection Report: Umzingwane Catchment", official EMA laboratory tests on 14 August 2026 recorded dissolved lithium (4.8 mg/L) and sulphate (1,120 mg/L) at 340% above statutory limits [Page 14], alongside a 12-metre HDPE liner tear on Tailings Dam #2 that triggered Compliance Order #EMA-BYO-882 on 02 September 2026 [Page 21]. Separate community claims of manual night-time valve discharges on 19 October 2026 remain unverified allegations because automated flow-meter logs were missing [Page 29].',
    evidenceFindings: [
      "[Page 14 — Section 3.2 — Laboratory Effluent Analysis at Weir #3] Water samples collected on 14 August 2026 at 400 metres downstream of Tailings Dam #2 recorded dissolved lithium concentrations of 4.8 mg/L and sulphate levels of 1,120 mg/L, exceeding the statutory Red-Class effluent threshold by 340%.",
      "[Page 21 — Section 4.1 — Non-Compliance & Geomembrane Liner Breach] Inspectors observed a 12-metre tear in the high-density polyethylene (HDPE) liner on the eastern embankment of Tailings Dam #2. Statutory Compliance Order #EMA-BYO-882 was issued on 02 September 2026 requiring immediate suspension of wet-slurry pumping.",
    ],
    allegationsToVerify: [
      "[Page 29 — Unverified Allegation] Three ward councillors and livestock owners alleged during public hearings that sluice valves were manually opened between 23:00 and 03:00 during heavy rainfall on 19 October 2026; inspectors noted no automated flow-meter logs were preserved for that 4-hour window.",
    ],
    humanVerificationChecklist: [
      "Inspect original source pages (p. 14, p. 21, p. 29) in the primary source reader on the right.",
      "Do not report Page 29 night-time valve claims as established fact without independent corroboration.",
      "Log Right-of-Reply outreach to Shengze Mineral Processing before moving task to Editorial Review.",
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
      {
        documentId: "doc-ema-audit",
        documentTitle:
          "2026 Auditor-General & EMA Joint Inspection Report: Umzingwane Catchment",
        pageNumber: 21,
        sectionTitle: "Section 4.1 — Non-Compliance & Geomembrane Liner Breach",
        exactQuote:
          "Inspectors observed a 12-metre tear in the high-density polyethylene (HDPE) liner on the eastern embankment of Tailings Dam #2. Statutory Compliance Order #EMA-BYO-882 was issued on 02 September 2026 requiring immediate suspension of wet-slurry pumping.",
        classification: "Documented Evidence",
      },
      {
        documentId: "doc-ema-audit",
        documentTitle:
          "2026 Auditor-General & EMA Joint Inspection Report: Umzingwane Catchment",
        pageNumber: 29,
        sectionTitle:
          "Section 5.4 — Community Submissions & Unverified Night Discharge Claims",
        exactQuote:
          "Three ward councillors and livestock owners alleged during public hearings that sluice valves were manually opened between 23:00 and 03:00 during heavy rainfall on 19 October 2026; inspectors noted no automated flow-meter logs were preserved for that 4-hour window.",
        classification: "Unverified Allegation",
      },
    ],
    timestamp: "2026-11-04 12:00",
  });

  const selectedDoc =
    documents.find((d) => d.id === selectedDocId) || documents[0];
  const hasAccessToSelected = selectedDoc.allowedOrgIds.includes(activeOrgId);

  const runResearchQuery = async (targetDocId?: string, customQuery?: string) => {
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
          preferredMode: inferencePreference,
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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadExcerpt.trim()) return;
    const newId = `doc-custom-${Date.now()}`;
    const newDoc: DocumentRecord = {
      id: newId,
      investigationId: "inv-umzingwane",
      title: uploadTitle.trim(),
      sourceOrgId: activeOrgId,
      allowedOrgIds: [activeOrgId, "org-byo", "org-hre", "org-cite"],
      documentType: "Public Audit Report",
      pageCount: 6,
      uploadedAt: "2026-11-04 12:10",
      aiConsentStatus: uploadConsent,
      summary: "Uploaded evidence document indexed into Qdrant with tenant ACLs.",
      extractedEntities: {
        people: ["Journalist Uploaded Source"],
        organisations: [
          organisations.find((o) => o.id === activeOrgId)?.name || "Partner Org",
        ],
        locations: ["Bulawayo / Umzingwane"],
        keyDates: ["November 2026"],
      },
      passages: [
        {
          id: `pas-custom-${Date.now()}`,
          pageNumber: 1,
          sectionTitle: "Section 1.1 — Uploaded Primary Evidence Passage",
          quote: uploadExcerpt.trim(),
          classification: "Documented Evidence",
          entities: ["Uploaded Dossier"],
          dates: ["November 2026"],
        },
      ],
    };

    onUploadDocument(newDoc);
    setSelectedDocId(newId);
    setShowUploadModal(false);
    setUploadTitle("");
    setUploadExcerpt("");
  };

  return (
    <div className="space-y-5">
      {/* Safeguard Top Banner */}
      <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">
                AI Newsroom Copilot — Grounded Research & Entity Extraction
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Zero Auto-Publish Safeguard Active
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Inspired by <strong>OCCRP Aleph</strong> & <strong>ICIJ Datashare</strong>. Every answer links to exact page passages and separates{" "}
              <span className="text-emerald-300 font-medium">Documented Evidence</span> from{" "}
              <span className="text-amber-300 font-medium">Unverified Allegations</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            Ingest Approved Document
          </button>
        </div>
      </div>

      {/* Optional Upload Modal */}
      {showUploadModal && (
        <form
          onSubmit={handleUploadSubmit}
          className="p-4 rounded-xl border border-teal-500/40 bg-slate-900/95 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Ingest New Approved Document into Investigation Index
            </h4>
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Document Title
              </label>
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., ZINWA Borehole Heavy Metal Test Certificate #408"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                AI Model Processing Consent Policy
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
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100"
              >
                <option value="Local Inference Only (Confidential)">
                  Local Inference Only (Ollama Air-Gapped — Sensitive Source Material)
                </option>
                <option value="Approved for Cloud & Local AI">
                  Approved Public Report (Server-Side Gemini API Allowed)
                </option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Extracted PDF Text / Key Evidence Passage (Page 1)
            </label>
            <textarea
              rows={3}
              required
              value={uploadExcerpt}
              onChange={(e) => setUploadExcerpt(e.target.value)}
              placeholder="Paste text from report or lab sheet..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs cursor-pointer"
            >
              Index Document & Extract Entities
            </button>
          </div>
        </form>
      )}

      {/* Document Selection Cards (Showing Multi-Org ACLs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between gap-2 cursor-pointer ${
                isSelected
                  ? "bg-[#15223b] border-teal-500/60 shadow-lg"
                  : "bg-[#0f172a] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {doc.documentType} • {doc.pageCount} pp.
                  </span>
                  {isAllowed ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Authorised
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Restricted ACL
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                  {doc.title}
                </h4>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>Owner: {ownerOrg?.shortName}</span>
                <span className="text-teal-300 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {doc.aiConsentStatus.includes("Local")
                    ? "Local Ollama Only"
                    : "Gemini / Local"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error / 403 Multi-Organisation Permission Block Banner */}
      {errorBanner && (
        <div className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-rose-200 uppercase tracking-wider">
              Multi-Organisation Access Control Enforced (HTTP 403)
            </h4>
            <p className="text-xs text-rose-300">{errorBanner}</p>
            <p className="text-[11px] text-slate-300">
              Connected Newsroom enforces tenant isolation in PostgreSQL Row-Level Security and Qdrant vector search. Switch your active newsroom persona in the top bar to{" "}
              <strong className="text-amber-300">Harare Investigative Collective</strong> to verify authorised access.
            </p>
          </div>
        </div>
      )}

      {/* Main Split View: Left = AI Query & Grounded Synthesis | Right = Original Source PDF Passage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Columns: Search Bar, Presets, Grounded Answer, Evidence vs Allegations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Ask Grounded Research Question
              </span>

              {/* Inference Router Switch */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">Gateway Mode:</span>
                {(["auto", "local", "cloud"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setInferencePreference(m)}
                    className={`px-2 py-0.5 rounded capitalize cursor-pointer ${
                      inferencePreference === m
                        ? "bg-teal-500 text-slate-950 font-semibold"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {m === "auto"
                      ? "Policy Auto"
                      : m === "local"
                      ? "Local Ollama"
                      : "Gemini API"}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about dates, figures, entities, or compliance orders..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
              />
              <button
                onClick={() => runResearchQuery()}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? "Retrieving..." : "Search Evidence"}
              </button>
            </div>

            {/* Preset Question Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
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
                  className="text-left text-[11px] px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                >
                  “{pq.slice(0, 68)}…”
                </button>
              ))}
            </div>
          </div>

          {/* Grounded AI Response Panel */}
          {aiResult && hasAccessToSelected && (
            <div className="p-4 rounded-xl border border-slate-800 bg-[#111a2e] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 block">
                    Grounded Synthesis (With Page Citations)
                  </span>
                  <h4 className="text-xs font-semibold text-slate-100 mt-0.5">
                    Query: “{aiResult.query}”
                  </h4>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 text-sky-300 border border-slate-700">
                  {aiResult.inferenceMode}
                </span>
              </div>

              {/* Synthesis Paragraph */}
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/90">
                {aiResult.answerSummary}
              </p>

              {/* Documented Evidence vs Unverified Allegations Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/15 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Documented Primary Evidence
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-200">
                    {aiResult.evidenceFindings.map((ef, i) => (
                      <li key={i} className="leading-snug">
                        • {ef}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/15 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    Allegations & Flags Requiring Verification
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-200">
                    {aiResult.allegationsToVerify.map((al, i) => (
                      <li key={i} className="leading-snug">
                        • {al}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Extracted Entities Bar */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 mb-2">
                  Extracted Entities & Key Dates in “{selectedDoc.title}”
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDoc.extractedEntities.organisations.map((org) => (
                    <span
                      key={org}
                      className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30"
                    >
                      Org: {org}
                    </span>
                  ))}
                  {selectedDoc.extractedEntities.people.map((person) => (
                    <span
                      key={person}
                      className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    >
                      Person: {person}
                    </span>
                  ))}
                  {selectedDoc.extractedEntities.keyDates.map((dt) => (
                    <span
                      key={dt}
                      className="text-[10px] px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30"
                    >
                      Date: {dt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Side-by-Side Primary Source Reader & Human Verification Sign-Off */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <div>
                <h4 className="text-xs font-semibold text-slate-100">
                  Primary Source Inspector
                </h4>
                <p className="text-[11px] text-slate-400">
                  Verify exact passages before quoting in journalism drafts
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {selectedDoc.pageCount} Pages Indexed
            </span>
          </div>

          {!hasAccessToSelected ? (
            <div className="p-8 text-center space-y-2 my-auto">
              <Lock className="w-8 h-8 text-rose-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-200">
                Source Material Locked by Organisation ACL
              </div>
              <p className="text-xs text-slate-400">
                Your current organisation ({activeOrgId}) is not on the access list for this confidential document.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {selectedDoc.passages.map((pas) => {
                const isHighlighted = highlightedPage === pas.pageNumber;
                const verifyKey = `${selectedDoc.id}-${pas.pageNumber}`;
                const isVerified = verifiedPages[verifyKey];

                return (
                  <div
                    key={pas.id}
                    onClick={() => setHighlightedPage(pas.pageNumber)}
                    className={`p-3.5 rounded-lg border transition cursor-pointer ${
                      isHighlighted
                        ? "border-teal-400 bg-teal-950/20 shadow-md"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-teal-300">
                        PAGE {pas.pageNumber} • {pas.sectionTitle}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          pas.classification === "Documented Evidence"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : pas.classification === "Unverified Allegation"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {pas.classification}
                      </span>
                    </div>

                    <blockquote className="text-xs text-slate-200 italic border-l-2 border-teal-500/60 pl-3 py-1 my-2 bg-slate-950/50 rounded-r">
                      “{pas.quote}”
                    </blockquote>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Primary PDF Passage
                      </span>

                      {isVerified ? (
                        <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Journalist
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
                          className="px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-[10px] font-medium cursor-pointer"
                        >
                          Mark Passage Human-Verified ✓
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
