"use client";

import React, { useState, useEffect } from "react";
import {
  Investigation,
  InvestigationDraft,
  KanbanTask,
  KanbanColumnId,
  DocumentRecord,
  Organisation,
} from "@/types/newsroom";
import KanbanBoard from "./KanbanBoard";
import AICopilotView from "./AICopilotView";
import OpenSourceAppsBridge from "./OpenSourceAppsBridge";
import {
  FolderGit2,
  FileEdit,
  GitPullRequest,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Quote,
  Save,
  Send,
  BookOpen,
  Bot,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface InvestigationWorkspaceViewProps {
  investigations: Investigation[];
  selectedInvestigationId: string;
  onSelectInvestigation: (id: string) => void;
  kanbanTasks: KanbanTask[];
  documents: DocumentRecord[];
  drafts: InvestigationDraft[];
  organisations: Organisation[];
  activeOrgId: string;
  onSwitchOrg: (orgId: string) => void;
  onMoveTask: (taskId: string, newColumn: KanbanColumnId) => void;
  onSignOffTask: (taskId: string) => void;
  onAddTask: (task: Omit<KanbanTask, "id">) => void;
  onAddTaskComment: (payload: {
    taskId: string;
    text: string;
    rightOfReplyStatus?: KanbanTask["rightOfReplyStatus"];
    evidenceRef?: string;
  }) => Promise<void>;
  onSaveDraft: (payload: {
    investigationId: string;
    headline: string;
    subheadline: string;
    bodyMarkdown: string;
    attributionText: string;
    licenseType: InvestigationDraft["licenseType"];
  }) => Promise<void>;
  onToggleApproval: (payload: {
    investigationId: string;
    role: string;
    note?: string;
  }) => Promise<void>;
  onPublishToExchange: (investigationId: string) => Promise<void>;
  onDocumentIndexed: (
    newState: Record<string, unknown>,
    doc: DocumentRecord
  ) => void;
  onLogAIQuery: (docTitle: string, mode: string, query: string) => void;
  onLogHumanVerification: (docTitle: string, pageNumber: number) => void;
}

export default function InvestigationWorkspaceView({
  investigations,
  selectedInvestigationId,
  onSelectInvestigation,
  kanbanTasks,
  documents,
  drafts,
  organisations,
  activeOrgId,
  onSwitchOrg,
  onMoveTask,
  onSignOffTask,
  onAddTask,
  onAddTaskComment,
  onSaveDraft,
  onToggleApproval,
  onPublishToExchange,
  onDocumentIndexed,
  onLogAIQuery,
  onLogHumanVerification,
}: InvestigationWorkspaceViewProps) {
  const [workflowStep, setWorkflowStep] = useState<
    "research" | "kanban" | "write_publish"
  >("research");

  const selectedInvestigation =
    investigations.find((i) => i.id === selectedInvestigationId) ||
    investigations[0];

  const hasAccess =
    selectedInvestigation.leadOrgId === activeOrgId ||
    selectedInvestigation.partnerOrgIds.includes(activeOrgId);

  const currentDraft =
    drafts.find((d) => d.investigationId === selectedInvestigation.id) ||
    drafts[0];

  const [headline, setHeadline] = useState(currentDraft?.headline || "");
  const [subheadline, setSubheadline] = useState(
    currentDraft?.subheadline || ""
  );
  const [bodyMarkdown, setBodyMarkdown] = useState(
    currentDraft?.bodyMarkdown || ""
  );
  const [attributionText, setAttributionText] = useState(
    currentDraft?.attributionText || ""
  );
  const [licenseType, setLicenseType] = useState<
    InvestigationDraft["licenseType"]
  >(currentDraft?.licenseType || "CC BY-NC-ND 4.0 (Network Attribution)");

  useEffect(() => {
    if (currentDraft) {
      setHeadline(currentDraft.headline);
      setSubheadline(currentDraft.subheadline);
      setBodyMarkdown(currentDraft.bodyMarkdown);
      setAttributionText(currentDraft.attributionText);
      setLicenseType(currentDraft.licenseType);
    }
  }, [currentDraft]);

  const invDocuments = documents.filter(
    (d) => d.investigationId === selectedInvestigation.id
  );
  const invTasks = kanbanTasks.filter(
    (t) => t.investigationId === selectedInvestigation.id
  );

  const citationMatches = bodyMarkdown.match(/\[Citation:[^\]]+\]/g) || [];
  const allGatesApproved =
    currentDraft?.approvals.every((a) => a.approved) ?? false;

  const insertCitationTag = (tag: string) => {
    setBodyMarkdown((prev) => `${prev.trim()}\n\n${tag}`);
  };

  return (
    <div className="space-y-6">
      {/* Linked Open-Source Engines (Paperless-ngx OCR, Open-WebUI + Google Gemma 3, Planka Kanban) */}
      <OpenSourceAppsBridge
        filterModule={workflowStep === "kanban" ? "kanban" : "ai"}
      />

      {/* Clean Page Header & Project Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
              Shared Investigation Workspace
            </span>
            <span className="text-xs text-slate-400">
              Embargo: {selectedInvestigation.embargoUntil}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            {selectedInvestigation.title}
          </h1>
        </div>

        {/* Project Switcher Pills */}
        <div className="flex items-center gap-2">
          {investigations.map((inv) => {
            const isSelected = inv.id === selectedInvestigationId;
            const isAuth =
              inv.leadOrgId === activeOrgId ||
              inv.partnerOrgIds.includes(activeOrgId);
            return (
              <button
                key={inv.id}
                onClick={() => onSelectInvestigation(inv.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 text-teal-300 border-teal-500/50 shadow"
                    : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {isAuth ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                )}
                {inv.codeName}
              </button>
            );
          })}
        </div>
      </div>

      {!hasAccess ? (
        <div className="p-10 rounded-2xl border border-rose-500/40 bg-rose-950/20 text-center space-y-4 max-w-xl mx-auto my-8">
          <Lock className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            Private Investigation — Restricted Access
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong>{selectedInvestigation.codeName}</strong> is an internal workspace owned by{" "}
            <strong>Harare Investigative Collective</strong>. Unpublished investigations are private by default until partner newsrooms are invited.
          </p>
          <button
            onClick={() => onSwitchOrg("org-hre")}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg"
          >
            Switch to Harare Collective to View Workspace →
          </button>
        </div>
      ) : (
        <>
          {/* 3-Step Guided Editorial Workflow Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setWorkflowStep("research")}
              className={`p-3.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                workflowStep === "research"
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    workflowStep === "research"
                      ? "bg-slate-950 text-teal-400"
                      : "bg-slate-800 text-teal-400"
                  }`}
                >
                  1
                </div>
                <div>
                  <div className="text-xs font-bold">
                    Evidence & AI Copilot
                  </div>
                  <div
                    className={`text-[11px] ${
                      workflowStep === "research"
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    Search {documents.length} reports & verify quotes
                  </div>
                </div>
              </div>
              <Bot className="w-4 h-4 shrink-0 opacity-80" />
            </button>

            <button
              onClick={() => setWorkflowStep("kanban")}
              className={`p-3.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                workflowStep === "kanban"
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    workflowStep === "kanban"
                      ? "bg-slate-950 text-teal-400"
                      : "bg-slate-800 text-teal-400"
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="text-xs font-bold">
                    Verification Board (Kanban)
                  </div>
                  <div
                    className={`text-[11px] ${
                      workflowStep === "kanban"
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {invTasks.filter((t) => Boolean(t.signedOffBy)).length} of{" "}
                    {invTasks.length} tasks human-verified
                  </div>
                </div>
              </div>
              <FolderGit2 className="w-4 h-4 shrink-0 opacity-80" />
            </button>

            <button
              onClick={() => setWorkflowStep("write_publish")}
              className={`p-3.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                workflowStep === "write_publish"
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    workflowStep === "write_publish"
                      ? "bg-slate-950 text-teal-400"
                      : "bg-slate-800 text-teal-400"
                  }`}
                >
                  3
                </div>
                <div>
                  <div className="text-xs font-bold">
                    Write, Sign Off & Publish
                  </div>
                  <div
                    className={`text-[11px] ${
                      workflowStep === "write_publish"
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {currentDraft?.approvals.filter((a) => a.approved).length ||
                      0}
                    /3 editors signed off • {citationMatches.length} citations
                  </div>
                </div>
              </div>
              <GitPullRequest className="w-4 h-4 shrink-0 opacity-80" />
            </button>
          </div>

          {/* STEP 1: EVIDENCE & AI RESEARCH COPILOT */}
          {workflowStep === "research" && (
            <div className="space-y-4">
              <AICopilotView
                documents={documents}
                organisations={organisations}
                activeOrgId={activeOrgId}
                onDocumentIndexed={onDocumentIndexed}
                onLogAIQuery={onLogAIQuery}
                onLogHumanVerification={onLogHumanVerification}
                onInsertCitationIntoDraft={(citationTag) => {
                  insertCitationTag(citationTag);
                  setWorkflowStep("write_publish");
                }}
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setWorkflowStep("kanban")}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-semibold text-xs flex items-center gap-2 cursor-pointer"
                >
                  Continue to Step 2: Verification Kanban Board{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DRAG-AND-DROP KANBAN BOARD */}
          {workflowStep === "kanban" && (
            <div className="space-y-4">
              <KanbanBoard
                tasks={invTasks}
                organisations={organisations}
                activeOrgId={activeOrgId}
                onMoveTask={onMoveTask}
                onSignOffTask={onSignOffTask}
                onAddTask={onAddTask}
                onAddTaskComment={onAddTaskComment}
                investigationId={selectedInvestigation.id}
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setWorkflowStep("write_publish")}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
                >
                  Continue to Step 3: Write Story & Editorial Sign-Off{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: UNIFIED STORY EDITOR + PRE-PUBLICATION SIGN-OFF CHECKLIST */}
          {workflowStep === "write_publish" && currentDraft && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Columns: Clean Story Editor + Evidence Citation Picker */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FileEdit className="w-4 h-4 text-teal-400" />
                        Collaborative Story Draft
                      </h3>
                      <p className="text-xs text-slate-400">
                        Write the article below and click any verified passage to insert a `[Citation: ...]` tag
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        onSaveDraft({
                          investigationId: selectedInvestigation.id,
                          headline,
                          subheadline,
                          bodyMarkdown,
                          attributionText,
                          licenseType,
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Draft
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Headline
                      </label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Standfirst / Subtitle
                      </label>
                      <input
                        type="text"
                        value={subheadline}
                        onChange={(e) => setSubheadline(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-medium">
                          Story Body
                        </label>
                        <span className="text-xs font-semibold text-teal-300">
                          {citationMatches.length} Verified Citations Attached
                        </span>
                      </div>
                      <textarea
                        rows={14}
                        value={bodyMarkdown}
                        onChange={(e) => setBodyMarkdown(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    {/* Quick 1-Click Citation Insertion Strip */}
                    <div className="pt-2">
                      <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                        Click a verified passage to append citation at bottom of draft:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {invDocuments.flatMap((doc) =>
                          doc.passages.map((pas) => (
                            <button
                              key={pas.id}
                              type="button"
                              onClick={() =>
                                insertCitationTag(
                                  `${pas.quote} [Citation: ${doc.title}, p. ${pas.pageNumber}]`
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 text-xs flex items-center gap-1.5 cursor-pointer transition"
                            >
                              <Quote className="w-3 h-3" />+ Cite{" "}
                              {doc.title.slice(0, 24)}… (p. {pas.pageNumber})
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: Pre-Publication Sign-Off Checklist & Publish Button */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-5 space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                      Editorial & Legal Sign-Off Gate
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      3 Required Approvals Before Publishing
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      AI never publishes content. All 3 partner sign-offs must be green to unlock publication to the News Wire.
                    </p>
                  </div>

                  {/* 3 Reviewer Cards */}
                  <div className="space-y-3">
                    {currentDraft.approvals.map((app) => {
                      const org = organisations.find((o) => o.id === app.orgId);
                      return (
                        <div
                          key={app.role}
                          className={`p-4 rounded-xl border transition space-y-2.5 ${
                            app.approved
                              ? "border-emerald-500/40 bg-emerald-950/15"
                              : "border-amber-500/40 bg-amber-950/15"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-bold text-white">
                                {app.role}
                              </div>
                              <div className="text-xs text-teal-300">
                                {app.reviewerName} • {org?.shortName}
                              </div>
                            </div>

                            {app.approved ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Signed Off
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Needs Sign-Off
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-300">{app.note}</p>

                          <button
                            onClick={() =>
                              onToggleApproval({
                                investigationId: selectedInvestigation.id,
                                role: app.role,
                                note: app.approved
                                  ? "Sign-off paused for final check."
                                  : "Verified primary sources and approved for publication.",
                              })
                            }
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                              app.approved
                                ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow"
                            }`}
                          >
                            {app.approved
                              ? "Undo Sign-Off"
                              : `Approve & Sign Off (${app.role}) ✓`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Licensing & Attribution Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">
                        Republication License:
                      </span>
                      <strong className="text-slate-200">{licenseType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        Mandatory Credit Line:
                      </span>
                      <span className="text-teal-300">{attributionText}</span>
                    </div>
                  </div>

                  {/* Primary Publish Button */}
                  <button
                    onClick={() =>
                      onPublishToExchange(selectedInvestigation.id)
                    }
                    disabled={!allGatesApproved}
                    className="w-full py-3 px-5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl transition"
                  >
                    <Send className="w-4 h-4" />
                    {allGatesApproved
                      ? "Publish Verified Story to News Wire →"
                      : "Sign Off Remaining Gate Above to Unlock Publish"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
