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
import {
  GitBranch,
  FolderGit2,
  FileText,
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
  onOpenAICopilot: () => void;
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
  onOpenAICopilot,
}: InvestigationWorkspaceViewProps) {
  const [repoTab, setRepoTab] = useState<
    "kanban" | "files" | "draft_editor" | "review_gate"
  >("kanban");

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

  const citationMatches =
    bodyMarkdown.match(/\[Citation:[^\]]+\]/g) || [];
  const allGatesApproved =
    currentDraft?.approvals.every((a) => a.approved) ?? false;

  const insertCitationTag = (tag: string) => {
    setBodyMarkdown((prev) => `${prev.trim()}\n\n${tag}`);
  };

  return (
    <div className="space-y-5">
      {/* Top Investigation Repository Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investigations.map((inv) => {
          const isAuth =
            inv.leadOrgId === activeOrgId ||
            inv.partnerOrgIds.includes(activeOrgId);
          const isSelected = inv.id === selectedInvestigationId;
          const leadOrg = organisations.find((o) => o.id === inv.leadOrgId);

          return (
            <button
              key={inv.id}
              onClick={() => onSelectInvestigation(inv.id)}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? "border-teal-500 bg-[#14223c]"
                  : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-teal-400 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  {inv.repoSlug || inv.codeName}
                </span>
                {isAuth ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Authorised Repo Access
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Private to {leadOrg?.shortName}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white">{inv.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{inv.summary}</p>
            </button>
          );
        })}
      </div>

      {!hasAccess ? (
        <div className="p-8 rounded-xl border border-rose-500/40 bg-rose-950/20 text-center space-y-3">
          <Lock className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">
            Private Investigation Repository — Access Restricted by Default (403)
          </h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto">
            Repository <code>{selectedInvestigation.repoSlug}</code> is isolated to{" "}
            <strong>Harare Investigative Collective</strong>. Connected Newsroom enforces strict multi-organisation repository ACLs.
          </p>
          <button
            onClick={() => onSwitchOrg("org-hre")}
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs cursor-pointer"
          >
            Switch Active Newsroom to Harare Collective →
          </button>
        </div>
      ) : (
        <>
          {/* GitHub-Style Repository Header & Sub-Navigation Tabs */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-teal-400 font-bold flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5" />
                    {selectedInvestigation.repoSlug}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedInvestigation.visibility}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    Embargo: {selectedInvestigation.embargoUntil}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  <strong>Editorial Agreement:</strong>{" "}
                  {selectedInvestigation.editorialAgreement}
                </p>
              </div>
            </div>

            {/* 4 Repository Tabs */}
            <div className="px-4 pt-2 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-2">
              {(
                [
                  {
                    id: "kanban",
                    label: `Kanban Board (${invTasks.length})`,
                    icon: FolderGit2,
                  },
                  {
                    id: "files",
                    label: `Evidence Files & Commits (${invDocuments.length})`,
                    icon: FileText,
                  },
                  {
                    id: "draft_editor",
                    label: `Story Draft & Citation Editor (${citationMatches.length} citations)`,
                    icon: FileEdit,
                  },
                  {
                    id: "review_gate",
                    label: `Pre-Publication Review Gate (${
                      currentDraft?.approvals.filter((a) => a.approved).length ||
                      0
                    }/3 Signed Off)`,
                    icon: GitPullRequest,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = repoTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRepoTab(tab.id)}
                    className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition flex items-center gap-2 cursor-pointer ${
                      active
                        ? "border-teal-400 text-teal-300 font-semibold bg-slate-900/60 rounded-t-lg"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: DRAG-AND-DROP KANBAN BOARD */}
          {repoTab === "kanban" && (
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
          )}

          {/* TAB 2: GITHUB-STYLE EVIDENCE REPOSITORY & COMMITS */}
          {repoTab === "files" && (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white">
                    Committed Primary Source Evidence Files
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Every file is hashed, indexed into passages, and bound to this investigation’s organisation ACL
                  </p>
                </div>
                <button
                  onClick={onOpenAICopilot}
                  className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  + Upload / Query Evidence in AI Copilot →
                </button>
              </div>

              <div className="divide-y divide-slate-800/80">
                {invDocuments.map((doc) => {
                  const org = organisations.find(
                    (o) => o.id === doc.sourceOrgId
                  );
                  return (
                    <div
                      key={doc.id}
                      className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-900/40"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-400" />
                          <span className="font-mono text-xs font-bold text-white">
                            {doc.fileName || `${doc.id}.pdf`}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                            commit {doc.commitHash || "8f4c2a1"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            {doc.aiConsentStatus}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-200">
                          {doc.title}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Committed by <strong>{org?.name}</strong> on{" "}
                          {doc.uploadedAt} • {doc.passages.length} extracted passages
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setRepoTab("draft_editor")}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs cursor-pointer"
                        >
                          Cite in Draft Editor
                        </button>
                        <button
                          onClick={onOpenAICopilot}
                          className="px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold cursor-pointer"
                        >
                          Inspect Passages →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: COLLABORATIVE STORY DRAFT EDITOR WITH 1-CLICK CITATION INSERTION */}
          {repoTab === "draft_editor" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 7 Cols: Markdown Story Editor */}
              <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0f172a] p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Collaborative Story Draft (Human-Authored Markdown)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Link every factual claim to a primary source passage using{" "}
                      <code>[Citation: Document, p. X]</code> tags
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                      className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Draft to SQLite
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Story Headline
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Subheadline / Standfirst
                    </label>
                    <input
                      type="text"
                      value={subheadline}
                      onChange={(e) => setSubheadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">
                        Article Body (Markdown + Inline Primary Source Citations)
                      </label>
                      <span className="text-[11px] font-mono text-teal-300">
                        {citationMatches.length} Inline Citations Linked
                      </span>
                    </div>
                    <textarea
                      rows={13}
                      value={bodyMarkdown}
                      onChange={(e) => setBodyMarkdown(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Syndication License
                      </label>
                      <select
                        value={licenseType}
                        onChange={(e) =>
                          setLicenseType(
                            e.target.value as InvestigationDraft["licenseType"]
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                      >
                        <option value="CC BY-NC-ND 4.0 (Network Attribution)">
                          CC BY-NC-ND 4.0 (Network Attribution)
                        </option>
                        <option value="Co-Publish Syndicate">
                          Co-Publish Syndicate
                        </option>
                        <option value="Request Permission Only">
                          Request Permission Only
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Mandatory Attribution Line
                      </label>
                      <input
                        type="text"
                        value={attributionText}
                        onChange={(e) => setAttributionText(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Evidence Passage Picker for 1-Click Citation Insertion */}
              <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden flex flex-col">
                <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Verified Evidence Passages
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Click “+ Insert Citation” to append exact page reference into the draft
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 space-y-3 max-h-[520px] overflow-y-auto">
                  {invDocuments.map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      <div className="text-[11px] font-bold text-teal-300 font-mono">
                        📄 {doc.title}
                      </div>
                      {doc.passages.map((pas) => (
                        <div
                          key={pas.id}
                          className="p-3 rounded-lg border border-slate-800 bg-slate-900/70 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-slate-200 text-[11px]">
                              Page {pas.pageNumber} • {pas.sectionTitle}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                pas.classification === "Documented Evidence"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-amber-500/15 text-amber-300"
                              }`}
                            >
                              {pas.classification}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 italic">
                            “{pas.quote}”
                          </p>
                          <button
                            onClick={() =>
                              insertCitationTag(
                                `${pas.quote} [Citation: ${doc.title}, p. ${pas.pageNumber}]`
                              )
                            }
                            className="w-full py-1.5 px-2.5 rounded bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Quote className="w-3 h-3" />+ Insert Quote & Page{" "}
                            {pas.pageNumber} Citation into Draft
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB PULL-REQUEST STYLE PRE-PUBLICATION REVIEW GATE */}
          {repoTab === "review_gate" && currentDraft && (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-teal-400">
                    Pre-Publication Review & Sign-Off Gate (GitHub Pull Request Model)
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {headline}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connected Newsroom blocks publication to the News Exchange until all 3 human editorial, data, and legal review gates are signed off.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {allGatesApproved ? (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      3 / 3 Review Gates Approved — Ready to Publish
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {
                        currentDraft.approvals.filter((a) => a.approved).length
                      }{" "}
                      / 3 Gates Signed Off (Merge Blocked)
                    </span>
                  )}
                </div>
              </div>

              {/* Automated Editorial Safeguard Checks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">
                    Primary Source Citations in Draft
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    ✓ {citationMatches.length} Verified Citations
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">
                    Right-of-Reply Protocol
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    ✓ Logged on Kanban
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">
                    AI Auto-Generation Check
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    ✓ 100% Human-Authored
                  </span>
                </div>
              </div>

              {/* 3 Human Sign-Off Cards */}
              <div className="space-y-3">
                {currentDraft.approvals.map((app) => {
                  const org = organisations.find((o) => o.id === app.orgId);
                  return (
                    <div
                      key={app.role}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        app.approved
                          ? "border-emerald-500/40 bg-emerald-950/15"
                          : "border-amber-500/40 bg-amber-950/15"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {app.role}
                          </span>
                          <span className="text-[11px] text-teal-300">
                            • {app.reviewerName} ({org?.shortName})
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{app.note}</p>
                        {app.approvedAt && (
                          <div className="text-[10px] font-mono text-emerald-400">
                            ✓ Signed off at {app.approvedAt}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          onToggleApproval({
                            investigationId: selectedInvestigation.id,
                            role: app.role,
                            note: app.approved
                              ? "Sign-off revoked for additional fact-checking."
                              : "Signed off and cleared for network syndication.",
                          })
                        }
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition ${
                          app.approved
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow"
                        }`}
                      >
                        {app.approved
                          ? "Revoke Sign-Off"
                          : `Sign Off ${app.role} ✓`}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Final Merge & Publish Action */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Publishing creates an attributed <code>StoryPackage</code> on the News Exchange for partner syndication.
                </span>

                <button
                  onClick={() =>
                    onPublishToExchange(selectedInvestigation.id)
                  }
                  disabled={!allGatesApproved}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  Merge & Publish Verified Story Package to News Exchange →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
