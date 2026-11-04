"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Scale,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
} from "lucide-react";

interface MediaVerificationWorkspaceProps {
  onSendToStoryDraft?: (verifiedBlock: string) => void;
  onContinueToKanban?: () => void;
}

export default function MediaVerificationWorkspace({
  onSendToStoryDraft,
  onContinueToKanban,
}: MediaVerificationWorkspaceProps) {
  const [activeScreen, setActiveScreen] = useState<1 | 2 | 3>(1);
  const [headlineInput, setHeadlineInput] = useState(
    "ZINWA & Bulawayo Council Confirm Umzingwane Dam Water Is 100% Safe After Routine Pipe Maintenance"
  );
  const [claimSource, setClaimSource] = useState(
    "Southern Corridor Online Aggregator / Viral WhatsApp Forward (28 October 2026)"
  );
  const [comparisonStage, setComparisonStage] = useState<"before" | "after">(
    "after"
  );
  const [verifying, setVerifying] = useState(false);
  const [liveAiSummary, setLiveAiSummary] = useState<string | null>(null);
  const [humanVerdict, setHumanVerdict] = useState<
    "Misleading — Contradicted by Primary Audit" | "Unverified — Awaiting Lab Annex" | "Verified Accurate"
  >("Misleading — Contradicted by Primary Audit");
  const [editorNotes, setEditorNotes] = useState(
    "The viral headline distorts a routine municipal maintenance notice while omitting Compliance Order #EMA-BYO-882 and statutory laboratory findings on Page 14 and Page 21 of the 2026 Auditor-General & EMA Joint Inspection Report."
  );
  const [signedByHuman, setSignedByHuman] = useState(true);

  const runLiveGeminiHeadlineCheck = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Verify this headline against the official report and identify what it distorts: "${headlineInput}"`,
          documentId: "doc-ema-audit",
          activeOrgId: "org-byo",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiveAiSummary(data.answerSummary);
        setActiveScreen(2);
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl space-y-5 p-5">
      {/* Header & 3-Screenshot Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Media Verification Workspace • Misleading Headline vs. Official Audit
          </span>
          <h3 className="text-base font-bold text-white mt-1.5">
            Collaborative Headline & Claim Verification
          </h3>
          <p className="text-xs text-slate-400">
            Step through the 3 verification stages below to inspect the submitted headline, Gemini evidence analysis, and human editorial verdict.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveScreen(1)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              activeScreen === 1
                ? "bg-teal-500 text-slate-950 border-teal-400"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            1. Submitted Claim
          </button>
          <button
            onClick={() => setActiveScreen(2)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              activeScreen === 2
                ? "bg-teal-500 text-slate-950 border-teal-400"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            2. Evidence & Before/After
          </button>
          <button
            onClick={() => setActiveScreen(3)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              activeScreen === 3
                ? "bg-teal-500 text-slate-950 border-teal-400"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            3. Human Verdict
          </button>
        </div>
      </div>

      {/* SCREEN 1: Original Media Claim / Misleading Headline */}
      {activeScreen === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="size-4" />
                  Submitted Viral Headline Under Investigation
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Case ID: VER-2026-BYO-04
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Headline or Media Claim to Verify
                </label>
                <input
                  type="text"
                  value={headlineInput}
                  onChange={(e) => setHeadlineInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Origin / Circulation Source
                  </label>
                  <input
                    type="text"
                    value={claimSource}
                    onChange={(e) => setClaimSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Submitted By (Journalist & Newsroom)
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-medium">
                    Nomsa Dube • Matabeleland Independent (04 Nov 2026)
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={runLiveGeminiHeadlineCheck}
                  disabled={verifying}
                  className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow"
                >
                  <Sparkles className="size-4" />
                  {verifying
                    ? "Running Gemini 3.8 Flash Evidence Check..."
                    : "Run AI Evidence Check & Open Screen 2"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-white flex items-center gap-2">
                <FileText className="size-4 text-teal-400" />
                Extracted Claims & Required Evidence Checklist
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 font-semibold">
                  Central Claim Extracted:
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Asserts that Umzingwane catchment water tested 100% within safe drinking limits and that discolouration reported by residents was caused solely by routine pipe flushing.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="text-slate-400 font-semibold">
                  Primary Evidence Needed to Verify:
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Document #1:</strong> ZINWA Routine Maintenance Notice (25 Oct 2026)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Document #2:</strong> 2026 Auditor-General & EMA Joint Inspection Report (Pages 14 & 21)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: AI-Assisted Evidence Analysis + Question 5 Before/After Comparison */}
      {activeScreen === 2 && (
        <div className="space-y-4">
          {/* Question 5 Before vs After Toggle Bar */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-teal-400" />
              <span className="text-xs font-bold text-white">
                Source Evidence Stage (Same Question Before vs. After Adding Official Audit Report):
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparisonStage("before")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  comparisonStage === "before"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Before (Only Press Release v1)
              </button>
              <button
                onClick={() => setComparisonStage("after")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  comparisonStage === "after"
                    ? "bg-teal-500 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                After (+ EMA & Auditor-General Lab Report v2)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: AI Evidence Comparison */}
            <div className="lg:col-span-7 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-300 flex items-center gap-1.5">
                  <Sparkles className="size-4" />
                  Gemini (gemini-3.8-flash) Grounded Evidence Analysis
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Same Question: “Is Umzingwane water confirmed 100% safe?”
                </span>
              </div>

              {comparisonStage === "before" ? (
                <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/30 space-y-2">
                  <div className="font-bold text-amber-300">
                    Output BEFORE Adding EMA Audit Report (1 Document Indexed):
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    “Based solely on <code className="text-amber-300">[ZINWA Public Maintenance Notice, p. 1]</code> (25 Oct 2026), ZINWA announced scheduled valve flushing on the Umzingwane pipeline. <strong>However, no quantitative laboratory water-quality test results or heavy-metal assays are present in this notice to verify the ‘100% safe’ claim.</strong> Status: Insufficient Evidence.”
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-teal-500/40 space-y-2.5">
                  <div className="font-bold text-teal-300">
                    Output AFTER Adding 2026 Auditor-General & EMA Report (2 Documents Indexed):
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {liveAiSummary ||
                      "Direct Contradiction Identified: While [ZINWA Notice, p. 1] referenced routine pipe flushing, the official [2026 Auditor-General & EMA Joint Inspection Report, Page 14] documents dissolved lithium concentrations of 4.8 mg/L and sulphate levels of 1,120 mg/L at Weir #3—exceeding statutory Red-Class safe limits by 340%. Furthermore, [Page 21] records a 12-metre HDPE geomembrane liner breach on Tailings Dam #2 (Compliance Order #EMA-BYO-882)."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30">
                      <div className="font-bold text-emerald-300 mb-1">
                        Verified Primary Evidence
                      </div>
                      <p className="text-slate-300">
                        • 4.8 mg/L lithium & 1,120 mg/L sulphates (340% over limit) <strong>[Page 14]</strong>
                        <br />• 12m liner tear & Order #EMA-BYO-882 <strong>[Page 21]</strong>
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-500/30">
                      <div className="font-bold text-rose-300 mb-1">
                        Headline Distortion Flagged
                      </div>
                      <p className="text-slate-300">
                        Headline generalizes a pipe-flushing notice into a “100% safe water” clearance, omitting active statutory contamination orders.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setActiveScreen(3)}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Proceed to Screen 3: Human Editorial Verdict <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Document Provenance Metadata Table (Question 5 Requirement) */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs">
              <div className="font-bold text-white flex items-center gap-2">
                <BookOpen className="size-4 text-teal-400" />
                Indexed Source Provenance Metadata
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="py-1.5 text-slate-400 font-medium">Document #1</td>
                      <td className="py-1.5 text-slate-200 font-semibold">
                        ZINWA Pipeline Maintenance Notice #19
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400 font-medium">Document #2 (Added)</td>
                      <td className="py-1.5 text-teal-300 font-semibold">
                        2026 Auditor-General & EMA Joint Inspection Report
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400 font-medium">Publisher</td>
                      <td className="py-1.5 text-slate-200">
                        Office of the Auditor-General & EMA Zimbabwe
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400 font-medium">Publication Date</td>
                      <td className="py-1.5 text-slate-200">15 October 2026</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400 font-medium">Original Source</td>
                      <td className="py-1.5 text-teal-400 font-mono">
                        auditorgeneral.gov.zw/annex-umzingwane-2026.pdf
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400 font-medium">Uploaded & Version</td>
                      <td className="py-1.5 text-slate-200">
                        04 Nov 2026 • Version 2.0 (SHA 9f3c2a1)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400 font-medium">Access Scope</td>
                      <td className="py-1.5 text-emerald-300">
                        Project Umzingwane Partner Newsrooms (3 Orgs)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: Human-Reviewed Verification Verdict */}
      {activeScreen === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
          <div className="lg:col-span-7 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Scale className="size-4 text-teal-400" />
                Human-Reviewed Verification Assessment
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                {humanVerdict}
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Editorial Verification Status (Human Determination Required)
              </label>
              <select
                value={humanVerdict}
                onChange={(e) =>
                  setHumanVerdict(e.target.value as typeof humanVerdict)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
              >
                <option value="Misleading — Contradicted by Primary Audit">
                  Misleading — Contradicted by Primary Audit
                </option>
                <option value="Unverified — Awaiting Lab Annex">
                  Unverified — Awaiting Lab Annex
                </option>
                <option value="Verified Accurate">Verified Accurate</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Journalist’s Final Assessment & Reasoning
              </label>
              <textarea
                rows={3}
                value={editorNotes}
                onChange={(e) => setEditorNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={signedByHuman}
                  onChange={(e) => setSignedByHuman(e.target.checked)}
                  className="accent-teal-500 size-4"
                />
                Signed off by Nomsa Dube (Matabeleland Independent) & Sipho Ncube (CITE ZW)
              </label>

              <div className="flex items-center gap-2">
                {onSendToStoryDraft && (
                  <button
                    onClick={() => {
                      onSendToStoryDraft(
                        `**Verification Verdict (${humanVerdict}):** ${editorNotes} [Citation: 2026 Auditor-General & EMA Joint Inspection Report, p. 14 & p. 21]`
                      );
                      if (onContinueToKanban) onContinueToKanban();
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold cursor-pointer"
                  >
                    Insert Verdict into Story Draft
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              Corrected Evidence-Backed Headline for Publication
            </div>
            <div className="p-3 rounded-lg bg-rose-950/25 border border-rose-500/30">
              <div className="text-xs text-rose-300 font-bold">
                Original Misleading Headline:
              </div>
              <p className="text-slate-300 line-through mt-0.5">
                “{headlineInput}”
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-950/25 border border-emerald-500/30">
              <div className="text-xs text-emerald-300 font-bold">
                Verified Collaborative Headline:
              </div>
              <p className="text-white font-bold mt-0.5">
                “EMA & Auditor-General Report Reveals 340% Lithium Spike in Umzingwane Catchment Despite Routine Maintenance Claims”
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
