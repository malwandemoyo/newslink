"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  INITIAL_ORGANISATIONS,
  INITIAL_RESOURCES,
  INITIAL_RESOURCE_REQUESTS,
  INITIAL_DISPATCH_BROADCASTS,
  INITIAL_EXPERTS,
  INITIAL_COLLABORATIONS,
  INITIAL_INVESTIGATIONS,
  INITIAL_INVESTIGATION_DRAFTS,
  INITIAL_KANBAN_TASKS,
  INITIAL_DOCUMENTS,
  INITIAL_STORIES,
  INITIAL_SYNDICATION_REQUESTS,
  INITIAL_AUDIT_LOGS,
} from "@/data/seed";
import {
  Organisation,
  Resource,
  ResourceRequest,
  DispatchBroadcast,
  JournalistProfile,
  CollaborationRequest,
  Investigation,
  InvestigationDraft,
  KanbanTask,
  KanbanColumnId,
  DocumentRecord,
  StoryPackage,
  SyndicationRequest,
  AuditLogEntry,
} from "@/types/newsroom";
import ResourceDispatchView from "@/components/ResourceDispatchView";
import InvestigationWorkspaceView from "@/components/InvestigationWorkspaceView";
import SecurityAuditView from "@/components/SecurityAuditView";
import GeographicMap from "@/components/GeographicMap";
import MediaVerificationWorkspace from "@/components/MediaVerificationWorkspace";
import {
  LayoutDashboard,
  Camera,
  Users,
  FolderGit2,
  Newspaper,
  Shield,
  ShieldCheck,
  Building2,
  CheckCircle2,
  RotateCcw,
  Share2,
  MapPin,
  Search,
  FileCheck,
  ArrowRight,
  BookOpen,
  Sparkles,
  KeyRound,
} from "lucide-react";

type NavSection =
  | "overview"
  | "resources"
  | "expertise"
  | "investigations"
  | "news_exchange"
  | "security_audit";

export default function ConnectedNewsroomApp() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [activeOrgId, setActiveOrgId] = useState<string>("org-byo");

  // Server-Backed State
  const [organisations, setOrganisations] = useState<Organisation[]>(
    INITIAL_ORGANISATIONS
  );
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(
    INITIAL_RESOURCE_REQUESTS
  );
  const [dispatchBroadcasts, setDispatchBroadcasts] = useState<
    DispatchBroadcast[]
  >(INITIAL_DISPATCH_BROADCASTS);
  const [experts, setExperts] = useState<JournalistProfile[]>(INITIAL_EXPERTS);
  const [collaborations, setCollaborations] = useState<CollaborationRequest[]>(
    INITIAL_COLLABORATIONS
  );
  const [investigations, setInvestigations] = useState<Investigation[]>(
    INITIAL_INVESTIGATIONS
  );
  const [investigationDrafts, setInvestigationDrafts] = useState<
    InvestigationDraft[]
  >(INITIAL_INVESTIGATION_DRAFTS);
  const [selectedInvestigationId, setSelectedInvestigationId] =
    useState<string>("inv-umzingwane");
  const [kanbanTasks, setKanbanTasks] =
    useState<KanbanTask[]>(INITIAL_KANBAN_TASKS);
  const [documents, setDocuments] =
    useState<DocumentRecord[]>(INITIAL_DOCUMENTS);
  const [stories, setStories] = useState<StoryPackage[]>(INITIAL_STORIES);
  const [syndicationRequests, setSyndicationRequests] = useState<
    SyndicationRequest[]
  >(INITIAL_SYNDICATION_REQUESTS);
  const [auditLogs, setAuditLogs] =
    useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Filters, Story Reader Modal & Toast
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("All");
  const [readingStory, setReadingStory] = useState<StoryPackage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ledgerTransactions, setLedgerTransactions] = useState<
    Array<{
      id: string;
      from_org_id: string | null;
      to_org_id: string | null;
      category: string;
      description: string;
      gross_amount_usd: number;
      platform_fee_usd: number;
      net_payout_usd: number;
      credits_moved: number;
      payment_rail: string;
      status: string;
      created_at: string;
    }>
  >([]);
  const [showRegisterOrgModal, setShowRegisterOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState(
    "Masvingo Mirror Community Radio"
  );
  const [newOrgCity, setNewOrgCity] = useState("Bulawayo");
  const [loadingAiRecs, setLoadingAiRecs] = useState(false);
  const [aiRecs, setAiRecs] = useState<{
    modelUsed: string;
    strategicBrief: string;
    recommendedResources: Array<{
      resourceId: string;
      title: string;
      city: string;
      rateUsd: number;
      matchReason: string;
    }>;
    recommendedExperts: Array<{
      expertId: string;
      name: string;
      role: string;
      city: string;
      matchReason: string;
    }>;
  } | null>(null);

  const runAiRecommendations = async () => {
    setLoadingAiRecs(true);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationId: selectedInvestigationId,
          activeOrgId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiRecs(data);
        triggerToast("Gemini 3.8 Flash matched equipment & specialists!");
      }
    } finally {
      setLoadingAiRecs(false);
    }
  };

  const activeOrg =
    organisations.find((o) => o.id === activeOrgId) || organisations[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const applyServerState = useCallback((data: Record<string, unknown>) => {
    if (Array.isArray(data.organisations))
      setOrganisations(data.organisations as Organisation[]);
    if (Array.isArray(data.resources))
      setResources(data.resources as Resource[]);
    if (Array.isArray(data.resourceRequests))
      setResourceRequests(data.resourceRequests as ResourceRequest[]);
    if (Array.isArray(data.dispatchBroadcasts))
      setDispatchBroadcasts(data.dispatchBroadcasts as DispatchBroadcast[]);
    if (Array.isArray(data.experts))
      setExperts(data.experts as JournalistProfile[]);
    if (Array.isArray(data.collaborations))
      setCollaborations(data.collaborations as CollaborationRequest[]);
    if (Array.isArray(data.investigations))
      setInvestigations(data.investigations as Investigation[]);
    if (Array.isArray(data.investigationDrafts))
      setInvestigationDrafts(data.investigationDrafts as InvestigationDraft[]);
    if (Array.isArray(data.kanbanTasks))
      setKanbanTasks(data.kanbanTasks as KanbanTask[]);
    if (Array.isArray(data.documents))
      setDocuments(data.documents as DocumentRecord[]);
    if (Array.isArray(data.stories))
      setStories(data.stories as StoryPackage[]);
    if (Array.isArray(data.syndicationRequests))
      setSyndicationRequests(data.syndicationRequests as SyndicationRequest[]);
    if (Array.isArray(data.ledgerTransactions))
      setLedgerTransactions(data.ledgerTransactions as typeof ledgerTransactions);
    if (Array.isArray(data.auditLogs))
      setAuditLogs(data.auditLogs as AuditLogEntry[]);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetch("/api/state")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) applyServerState(data);
      })
      .catch(() => {});
  }, [applyServerState]);

  const mutateServerState = async (
    action: string,
    payload: Record<string, unknown> = {},
    toastText?: string
  ) => {
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, activeOrgId, payload }),
      });
      const data = await res.json();
      if (res.ok) {
        applyServerState(data);
        if (toastText) triggerToast(toastText);
        return true;
      } else {
        triggerToast(data.error || "Operation failed");
        return false;
      }
    } catch {
      triggerToast("Network error communicating with backend");
      return false;
    }
  };

  const handleResetDatabase = async () => {
    await mutateServerState(
      "reset_db",
      {},
      "Workspace reset to starting state."
    );
    setActiveOrgId("org-byo");
  };

  const handleInviteExpert = async (expert: JournalistProfile) => {
    const exists = collaborations.some(
      (c) =>
        c.expertId === expert.id && c.investigationId === "inv-umzingwane"
    );
    if (exists) {
      triggerToast(`${expert.name} is already on Project Umzingwane.`);
      return;
    }
    await mutateServerState(
      "create_collaboration",
      {
        expertId: expert.id,
        expertName: expert.name,
        toOrgId: expert.orgId,
        roleRequested: `Specialist Collaboration: ${expert.skills[0]}`,
        scopeNote:
          "Cross-reference procurement ledger #URDC-2026-09 and verify EMA water sample tables.",
      },
      `${expert.name} added to the investigation team!`
    );
  };

  const handleMoveKanbanTask = async (
    taskId: string,
    newColumn: KanbanColumnId
  ) => {
    const targetTask = kanbanTasks.find((t) => t.id === taskId);
    if (
      newColumn === "syndication_ready" &&
      targetTask &&
      !targetTask.signedOffBy
    ) {
      triggerToast(
        "Please click 'Sign Off Check' on this card before moving it to Ready for Exchange."
      );
      return;
    }
    await mutateServerState(
      "move_kanban_task",
      { taskId, newColumn },
      `Moved task to '${newColumn.replace("_", " ")}'.`
    );
  };

  const handleSignOffKanbanTask = async (taskId: string) => {
    await mutateServerState(
      "signoff_kanban_task",
      { taskId },
      `Task marked as human-verified.`
    );
  };

  const handleAddKanbanTask = async (newTask: Omit<KanbanTask, "id">) => {
    await mutateServerState(
      "add_kanban_task",
      { task: newTask },
      "Added new task to board."
    );
  };

  const handleRequestSyndication = async (story: StoryPackage) => {
    const alreadyRequested = syndicationRequests.some(
      (s) => s.storyId === story.id && s.requestingOrgId === activeOrgId
    );
    if (alreadyRequested) {
      triggerToast(
        `${activeOrg.shortName} already has republication rights for this story.`
      );
      return;
    }
    await mutateServerState(
      "request_syndication",
      {
        storyId: story.id,
        originOrgId: story.originOrgId,
        agreedAttribution: story.attributionRequirement,
      },
      `Story licensed for republication by ${activeOrg.name}!`
    );
  };

  if (!mounted) {
    return null;
  }

  // Workflow completion indicators
  const gearMatched =
    dispatchBroadcasts.some((b) => b.status === "Matched & Dispatched") ||
    resourceRequests.some((r) => r.status === "Approved");
  const expertMatched = collaborations.length > 1;
  const currentDraft = investigationDrafts[0];
  const allGatesSigned =
    currentDraft?.approvals.every((a) => a.approved) ?? false;

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 backdrop-blur border border-slate-700 text-slate-100 pl-4 pr-5 py-3.5 rounded-xl shadow-2xl shadow-black/50 flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-teal-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4 text-teal-400" />
          </span>
          <span className="text-sm font-medium leading-snug">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 flex flex-col justify-between lg:sticky lg:top-0 lg:h-dvh">
        <div>
          {/* Brand Logo */}
          <div className="px-5 py-6 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-teal-400 flex items-center justify-center text-slate-950 font-serif font-bold text-lg">
              NL
            </div>
            <div>
              <h1 className="text-lg text-slate-50 leading-none">
                NewsLink
              </h1>
              <p className="text-xs text-slate-400 mt-1.5">
                Stronger newsrooms. Better journalism.
              </p>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="px-3 pt-2 space-y-0.5" aria-label="Primary">
            {(
              [
                {
                  id: "overview",
                  label: "My Newsroom Desk",
                  icon: LayoutDashboard,
                },
                {
                  id: "resources",
                  label: "Gear & Field Crew",
                  icon: Camera,
                  count: `${
                    resources.filter((r) => r.status === "Available").length
                  } free`,
                },
                {
                  id: "expertise",
                  label: "People & Experts",
                  icon: Users,
                  count: `${experts.length}`,
                },
                {
                  id: "investigations",
                  label: "Investigation Workspace",
                  icon: FolderGit2,
                  count: "Active",
                },
                {
                  id: "news_exchange",
                  label: "News Wire & Exchange",
                  icon: Newspaper,
                  count: `${stories.length}`,
                },
                {
                  id: "security_audit",
                  label: "Permissions & Activity",
                  icon: Shield,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition cursor-pointer ${
                    isActive
                      ? "bg-teal-500/10 text-teal-100 font-semibold"
                      : "text-slate-400 font-medium hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-teal-400" />
                  )}
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`size-4 ${
                        isActive ? "text-teal-300" : "text-slate-500"
                      }`}
                    />
                    {item.label}
                  </span>
                  {"count" in item && item.count && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                        isActive
                          ? "bg-teal-400/15 text-teal-200"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Principle & Reset */}
        <div className="p-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
              <ShieldCheck className="size-4" />
              Journalists in Control
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI assists research and citations. Humans verify facts and approve publication.
            </p>
          </div>

          <button
            onClick={handleResetDatabase}
            className="w-full py-2 px-3 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            Reset Demo Data
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar: Active Newsroom Switcher + 4-Step Workflow Progress */}
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/75 backdrop-blur-xl px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-500">
              Viewing as
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {organisations.map((org) => {
              const isCurrent = org.id === activeOrgId;
              return (
                <button
                  key={org.id}
                  onClick={() => {
                    setActiveOrgId(org.id);
                    triggerToast(`Now viewing as ${org.name} (${org.city}).`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? "bg-slate-700/70 text-slate-50 shadow-sm ring-1 ring-white/5"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Building2 className={`size-3.5 ${isCurrent ? "text-teal-300" : ""}`} />
                  {org.shortName}
                  <span className="text-xs font-normal text-slate-500">{org.city}</span>
                </button>
              );
            })}
            </div>
          </div>

          {/* Interactive 4-Step Story Workflow Pills */}
          <div className="hidden xl:flex items-center gap-1 text-xs">
            {(
              [
                {
                  num: 1,
                  label: "1. Gear & Crew",
                  nav: "resources" as NavSection,
                  done: gearMatched,
                },
                {
                  num: 2,
                  label: "2. Specialists",
                  nav: "expertise" as NavSection,
                  done: expertMatched,
                },
                {
                  num: 3,
                  label: "3. Research & Write",
                  nav: "investigations" as NavSection,
                  done: allGatesSigned,
                },
                {
                  num: 4,
                  label: "4. News Wire",
                  nav: "news_exchange" as NavSection,
                  done: stories.length > 2,
                },
              ] as const
            ).map((st, i) => (
              <React.Fragment key={st.num}>
                {i > 0 && <span className="w-4 h-px bg-slate-700" />}
                <button
                  onClick={() => setActiveNav(st.nav)}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
                    activeNav === st.nav
                      ? "text-slate-50 font-semibold bg-slate-800"
                      : st.done
                      ? "text-emerald-300 hover:bg-slate-800/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span
                    className={`size-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      st.done
                        ? "bg-emerald-500/15 text-emerald-300"
                        : activeNav === st.nav
                        ? "bg-teal-400 text-slate-950"
                        : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
                    }`}
                  >
                    {st.done ? <CheckCircle2 className="size-3.5" /> : st.num}
                  </span>
                  {st.label.replace(/^\d\.\s/, "")}
                </button>
              </React.Fragment>
            ))}
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto space-y-8 overflow-y-auto">
          {/* 1. MY NEWSROOM DESK (OVERVIEW) */}
          {activeNav === "overview" && (
            <div className="space-y-8">
              {/* Welcome & Active Story Hero Card */}
              <div className="rounded-2xl border border-slate-800 border-t-2 border-t-teal-500 bg-slate-900 p-6 lg:p-8 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium">
                      <span className="size-2 rounded-full bg-teal-400" />
                      Active desk: {activeOrg.name} ({activeOrg.city})
                    </div>
                    <h2 className="text-3xl lg:text-4xl text-slate-50 leading-tight text-balance">
                      Umzingwane River Water &amp; Lithium Tailings Investigation
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed text-pretty">
                      Co-reporting with <strong className="text-slate-100 font-semibold">CITE ZW</strong> and{" "}
                      <strong className="text-slate-100 font-semibold">Harare Investigative Collective</strong>. Follow the three steps below to borrow field gear, verify the public audit report, and publish to the News Wire.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveNav("investigations")}
                    className="px-5 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold text-sm flex items-center gap-2 cursor-pointer shrink-0 transition"
                  >
                    Open Investigation Workspace
                    <ArrowRight className="size-4" />
                  </button>
                </div>

                {/* 3 Clear Workflow Cards right inside the Hero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Step Card 1 */}
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-300">
                          Step 1: Field Gear &amp; Crew
                        </span>
                        <Camera className="size-4 text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-100">
                        Sony FX6 Camera &amp; Field Crew
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed text-pretty">
                        CITE ZW in Bulawayo has offered their 4K Sony FX6 kit + operator for <span className="tabular-nums">$25/day</span> fuel cover.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("resources")}
                      className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      View Gear &amp; Accept Offer
                    </button>
                  </div>

                  {/* Step Card 2 */}
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-300">
                          Step 2: AI Document Research
                        </span>
                        <BookOpen className="size-4 text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-100">
                        Verify 2026 EMA Audit Report
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed text-pretty">
                        Search the <span className="tabular-nums">42-page</span> inspection report with exact page citations and distinguish evidence from allegations.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("investigations")}
                      className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      Search Documents &amp; Cite
                    </button>
                  </div>

                  {/* Step Card 3 */}
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-300">
                          Step 3: Editorial Sign-Off
                        </span>
                        <Share2 className="size-4 text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-100">
                        Sign Off &amp; Syndicate Story
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed text-pretty tabular-nums">
                        {
                          currentDraft?.approvals.filter((a) => a.approved)
                            .length
                        }{" "}
                        of 3 editors have signed off. Approve the final legal check to publish to the News Wire.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("news_exchange")}
                      className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      Open News Wire ({stories.length} Stories)
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE 3-SCREEN MISLEADING HEADLINE VERIFIER (Hackathon Questions 1, 2, 3 & 5) */}
              <MediaVerificationWorkspace
                onContinueToKanban={() => setActiveNav("investigations")}
              />

              {/* LIVE GEOSPATIAL NETWORK MAP (Newsrooms, Equipment, Specialists & Active Broadcasts) */}
              <GeographicMap
                organisations={organisations}
                resources={resources}
                broadcasts={dispatchBroadcasts}
                experts={experts}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                onRequestResource={() => setActiveNav("resources")}
                onSelectBroadcast={() => setActiveNav("resources")}
                onInviteExpert={(exp) => handleInviteExpert(exp)}
              />

              {/* AI RESOURCE & COLLABORATOR MATCHMAKER (Section 3 Module 5 of Original Prompt) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-teal-300">
                      AI Newsroom Assistant
                    </span>
                    <h3 className="text-base font-semibold text-slate-100 mt-0.5">
                      Resource &amp; Collaborator Matchmaker
                    </h3>
                    <p className="text-xs text-slate-400">
                      Matches available partner equipment and specialist journalists across the network to your active investigation.
                    </p>
                  </div>
                  <button
                    onClick={runAiRecommendations}
                    disabled={loadingAiRecs}
                    className="px-4 py-2.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold text-xs flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Sparkles className="size-4" />
                    {loadingAiRecs
                      ? "Matching gear and specialists..."
                      : "Recommend Gear & Collaborators"}
                  </button>
                </div>

                {aiRecs && (
                  <div className="space-y-4 pt-3 border-t border-slate-800 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                      <strong className="text-teal-300">Strategy ({aiRecs.modelUsed}):</strong>{" "}
                      <span>{aiRecs.strategicBrief}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <div className="font-semibold text-slate-200">
                          Recommended Partner Equipment
                        </div>
                        {aiRecs.recommendedResources.map((rec) => (
                          <div
                            key={rec.resourceId}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="font-semibold text-slate-100 tabular-nums">
                                {rec.title} ({rec.city} · ${rec.rateUsd}/day)
                              </div>
                              <p className="text-slate-400 mt-0.5">
                                {rec.matchReason}
                              </p>
                            </div>
                            <button
                              onClick={() => setActiveNav("resources")}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold shrink-0 cursor-pointer"
                            >
                              Book
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2.5">
                        <div className="font-semibold text-slate-200">
                          Recommended Specialist Collaborators
                        </div>
                        {aiRecs.recommendedExperts.map((rec) => {
                          const expObj = experts.find(
                            (e) => e.id === rec.expertId
                          );
                          return (
                            <div
                              key={rec.expertId}
                              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                            >
                              <div>
                                <div className="font-semibold text-slate-100">
                                  {rec.name} · {rec.role} ({rec.city})
                                </div>
                                <p className="text-slate-400 mt-0.5">
                                  {rec.matchReason}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  if (expObj) handleInviteExpert(expObj);
                                  else setActiveNav("expertise");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold shrink-0 cursor-pointer"
                              >
                                Invite
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Needed From Your Desk (Live Offers & Approvals) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Live Field Dispatch Offers */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Incoming Field Crew & Gear Offers
                      </h3>
                      <p className="text-xs text-slate-400">
                        Direct peer-to-peer offers on your urgent Bulawayo camera request
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("resources")}
                      className="text-xs text-teal-400 hover:underline font-semibold cursor-pointer"
                    >
                      See All
                    </button>
                  </div>

                  {dispatchBroadcasts.slice(0, 1).map((b) => (
                    <div key={b.id} className="space-y-3">
                      {b.handoverPin && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs">
                          <span className="text-emerald-200 font-semibold flex items-center gap-2">
                            <KeyRound className="size-4 text-emerald-400" />
                            Crew Dispatched! Handover PIN:
                          </span>
                          <span className="font-mono font-semibold text-sm px-3 py-1 rounded-lg bg-emerald-500 text-slate-950">
                            {b.handoverPin}
                          </span>
                        </div>
                      )}

                      {b.bids.map((bid) => (
                        <div
                          key={bid.id}
                          className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {bid.bidderName}
                              </span>
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                                ${bid.proposedRateUsd}/day
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">
                              {bid.resourceTitle}
                            </p>
                            <p className="text-xs text-teal-400">
                              {bid.etaNote}
                            </p>
                          </div>

                          {b.status !== "Matched & Dispatched" ? (
                            <button
                              onClick={() =>
                                mutateServerState(
                                  "accept_dispatch_bid",
                                  { broadcastId: b.id, bidId: bid.id },
                                  "Offer accepted! Handover PIN generated."
                                )
                              }
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow"
                            >
                              Accept Offer ✓
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-400">
                              {bid.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Right: Participating Newsrooms in the Network + Onboarding */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Participating Independent Newsrooms ({organisations.length})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Switch newsrooms or onboard a new partner organisation
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setShowRegisterOrgModal(!showRegisterOrgModal)
                      }
                      className="px-3 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                    >
                      + Register Newsroom
                    </button>
                  </div>

                  {showRegisterOrgModal && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newOrgName.trim()) return;
                        await mutateServerState(
                          "register_organisation",
                          {
                            name: newOrgName.trim(),
                            shortName: newOrgName.trim().slice(0, 16),
                            city: newOrgCity,
                          },
                          `Registered ${newOrgName} with $300 Escrow + 120 Credits!`
                        );
                        setShowRegisterOrgModal(false);
                      }}
                      className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/40 space-y-2.5 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          placeholder="Newsroom Name..."
                          className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                        <select
                          value={newOrgCity}
                          onChange={(e) => setNewOrgCity(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        >
                          <option value="Bulawayo">Bulawayo</option>
                          <option value="Harare">Harare</option>
                          <option value="Mutare">Mutare</option>
                          <option value="Gweru">Gweru</option>
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold cursor-pointer"
                        >
                          Onboard & Activate Wallet ($300 + 120 Credits)
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {organisations.map((org) => {
                      const isCurrent = org.id === activeOrgId;
                      return (
                        <button
                          key={org.id}
                          onClick={() => {
                            setActiveOrgId(org.id);
                            triggerToast(`Switched to ${org.name}.`);
                          }}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                            isCurrent
                              ? "border-teal-500 bg-teal-500/10"
                              : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-white">
                              {org.shortName}
                            </span>
                            <span className="text-xs text-teal-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {org.city}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {org.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Money & Network Credits Movement Ledger (Escrow, Gear Rentals & Story Syndication Splits) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Escrow Wallet & Network Credit Settlement Ledger
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tracks how money (USD via Paynow / EcoCash with 95% Lender / 5% Platform fee) and Reciprocal Network Credits move across newsrooms
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300">
                    Dual-Rail: USD Escrow (5% Fee) + Reciprocal Credits (0% Fee)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Settlement Details</th>
                        <th className="py-2 px-3">Gross USD</th>
                        <th className="py-2 px-3">Platform Fee (5%)</th>
                        <th className="py-2 px-3">Net to Newsroom</th>
                        <th className="py-2 px-3">Network Credits</th>
                        <th className="py-2 px-3">Payment Rail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {ledgerTransactions.slice(0, 6).map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-2.5 px-3 font-semibold text-teal-300">
                            {tx.category}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">
                            {tx.description}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-white">
                            ${Number(tx.gross_amount_usd).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-amber-300">
                            ${Number(tx.platform_fee_usd).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-300 font-bold">
                            ${Number(tx.net_payout_usd).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-sky-300">
                            {tx.credits_moved > 0 ? `+${tx.credits_moved} cr` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {tx.payment_rail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. GEAR & FIELD CREW EXCHANGE */}
          {activeNav === "resources" && (
            <ResourceDispatchView
              organisations={organisations}
              resources={resources}
              resourceRequests={resourceRequests}
              broadcasts={dispatchBroadcasts}
              experts={experts}
              activeOrgId={activeOrgId}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              onCreateResourceRequest={async (payload) => {
                await mutateServerState(
                  "create_resource_request",
                  payload,
                  "Booking requested & Handover PIN generated!"
                );
              }}
              onCounterOfferRequest={async (payload) => {
                await mutateServerState(
                  "counter_offer_request",
                  payload,
                  `Counter-offer ($${payload.counterRateUsd}/day) sent!`
                );
              }}
              onUpdateResourceRequest={async (payload) => {
                await mutateServerState(
                  "update_resource_request",
                  payload,
                  `Booking updated to '${payload.nextStatus}'.`
                );
              }}
              onCreateBroadcast={async (payload) => {
                await mutateServerState(
                  "create_dispatch_broadcast",
                  payload,
                  `Field need posted in ${payload.city}!`
                );
              }}
              onSubmitBid={async (payload) => {
                await mutateServerState(
                  "submit_dispatch_bid",
                  payload,
                  `Offer ($${payload.proposedRateUsd}/day) sent!`
                );
              }}
              onAcceptBid={async (payload) => {
                await mutateServerState(
                  "accept_dispatch_bid",
                  payload,
                  "Offer accepted, Escrow locked & Handover PIN generated!"
                );
              }}
              onCreateResource={async (payload) => {
                await mutateServerState(
                  "create_resource",
                  payload,
                  `Equipment '${payload.title}' priced via Gemini AI & listed!`
                );
              }}
              onSwitchOrg={(orgId) => {
                setActiveOrgId(orgId);
                const orgObj = organisations.find((o) => o.id === orgId);
                triggerToast(`Switched to ${orgObj?.name}.`);
              }}
            />
          )}

          {/* 3. PEOPLE & EXPERTS */}
          {activeNav === "expertise" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Specialist Journalists & Researchers
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Discover verified data journalists, drone operators, media lawyers, and translators across partner newsrooms.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="size-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                      placeholder="Search skill or beat..."
                      className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 w-60"
                    />
                  </div>
                  {["All", "English", "Ndebele", "Shona", "Ndau"].map(
                    (lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguageFilter(lang)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                          languageFilter === lang
                            ? "bg-teal-500 text-slate-950"
                            : "bg-slate-900 text-slate-300 border border-slate-800"
                        }`}
                      >
                        {lang}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {experts
                  .filter((exp) => {
                    const matchesLang =
                      languageFilter === "All" ||
                      exp.languages.includes(languageFilter);
                    const matchesSkill =
                      !skillFilter.trim() ||
                      `${exp.name} ${exp.role} ${exp.skills.join(" ")} ${exp.beats.join(" ")}`
                        .toLowerCase()
                        .includes(skillFilter.toLowerCase());
                    return matchesLang && matchesSkill;
                  })
                  .map((exp) => {
                    const org = organisations.find((o) => o.id === exp.orgId);
                    const isCollaborating = collaborations.some(
                      (c) => c.expertId === exp.id
                    );

                    return (
                      <div
                        key={exp.id}
                        className="p-5 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col justify-between gap-5 shadow-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-white">
                                {exp.name}
                              </h3>
                              <p className="text-xs text-teal-400 font-medium mt-0.5">
                                {exp.role}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                                exp.availability === "Available for Collab"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-amber-500/15 text-amber-300"
                              }`}
                            >
                              {exp.availability}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-teal-400" />
                            {org?.name} ({exp.city})
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {exp.bio}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {exp.skills.map((sk) => (
                              <span
                                key={sk}
                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-sky-300 border border-slate-800"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>

                          <div className="text-xs text-slate-400 pt-1">
                            Languages:{" "}
                            <strong className="text-slate-200">
                              {exp.languages.join(", ")}
                            </strong>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800">
                          {isCollaborating ? (
                            <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                              <CheckCircle2 className="size-4" />
                              Collaborating on Umzingwane Story
                            </div>
                          ) : (
                            <button
                              onClick={() => handleInviteExpert(exp)}
                              className="w-full py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
                            >
                              Invite to Investigation
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 4. INVESTIGATION WORKSPACE (3-Step Research → Kanban → Write & Publish) */}
          {activeNav === "investigations" && (
            <InvestigationWorkspaceView
              investigations={investigations}
              selectedInvestigationId={selectedInvestigationId}
              onSelectInvestigation={setSelectedInvestigationId}
              kanbanTasks={kanbanTasks}
              documents={documents}
              drafts={investigationDrafts}
              organisations={organisations}
              activeOrgId={activeOrgId}
              onSwitchOrg={(orgId) => {
                setActiveOrgId(orgId);
                triggerToast(`Switched to ${orgId}.`);
              }}
              onMoveTask={handleMoveKanbanTask}
              onSignOffTask={handleSignOffKanbanTask}
              onAddTask={handleAddKanbanTask}
              onAddTaskComment={async (payload) => {
                await mutateServerState(
                  "add_task_comment",
                  payload,
                  "Note saved."
                );
              }}
              onSaveDraft={async (payload) => {
                await mutateServerState(
                  "save_investigation_draft",
                  payload,
                  "Story draft saved!"
                );
              }}
              onToggleApproval={async (payload) => {
                await mutateServerState(
                  "toggle_draft_approval",
                  payload,
                  `Updated sign-off for ${payload.role}.`
                );
              }}
              onPublishToExchange={async (invId) => {
                const ok = await mutateServerState(
                  "publish_draft_to_exchange",
                  { investigationId: invId },
                  "Story published to the News Wire!"
                );
                if (ok) {
                  setActiveNav("news_exchange");
                }
              }}
              onDocumentIndexed={(newState, newDoc) => {
                applyServerState(newState);
                triggerToast(`Added "${newDoc.title}" to investigation files!`);
              }}
              onLogAIQuery={(docTitle, mode, q) => {
                mutateServerState("log_audit", {
                  category: "AI Query",
                  actionText: `Searched "${q}" in '${docTitle}'`,
                  resourceTarget: docTitle,
                });
              }}
              onLogHumanVerification={(docTitle, pageNum) => {
                mutateServerState(
                  "log_audit",
                  {
                    category: "Human Verification",
                    actionText: `Verified Page ${pageNum} in '${docTitle}'`,
                    resourceTarget: docTitle,
                  },
                  `Page ${pageNum} marked as verified.`
                );
              }}
              onCreateInvestigation={async (payload) => {
                await mutateServerState(
                  "create_investigation",
                  payload,
                  `Created ${payload.codeName} & generated Gemini AI Kanban tasks!`
                );
              }}
              onAiGenerateTasks={async (invId) => {
                await mutateServerState(
                  "ai_generate_kanban_tasks",
                  { investigationId: invId },
                  "Generated new verification tasks on Kanban board via Gemini 3.8 Flash!"
                );
              }}
            />
          )}

          {/* 5. NEWS WIRE & SYNDICATION EXCHANGE */}
          {activeNav === "news_exchange" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h1 className="text-xl font-bold text-white">
                    News Wire & Story Syndication
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Discover and republish human-verified stories from partner newsrooms with clear attribution and licensing.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  {stories.length} Verified Story Packages
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stories.map((story) => {
                  const originOrg = organisations.find(
                    (o) => o.id === story.originOrgId
                  );
                  const coOrgs = story.coAuthorOrgIds
                    .map(
                      (id) =>
                        organisations.find((o) => o.id === id)?.shortName
                    )
                    .filter(Boolean);

                  return (
                    <div
                      key={story.id}
                      className="p-6 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col justify-between gap-5 shadow-sm"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            {story.licenseType}
                          </span>
                          <span className="text-xs text-emerald-300 flex items-center gap-1.5 font-semibold">
                            <FileCheck className="size-4" />
                            {story.embargoLift}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white leading-snug">
                            {story.title}
                          </h3>
                          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                            {story.subtitle}
                          </p>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                          “{story.excerpt}”
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {story.mediaIncluded.map((m) => (
                            <span
                              key={m}
                              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-sky-300 border border-slate-800"
                            >
                              ✓ {m}
                            </span>
                          ))}
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                          <div className="text-slate-200">
                            <strong>Origin:</strong> {originOrg?.name}{" "}
                            {coOrgs.length > 0 &&
                              `+ Co-reported with ${coOrgs.join(", ")}`}
                          </div>
                          <div className="text-teal-300">
                            <strong>Credit Line:</strong>{" "}
                            {story.attributionRequirement}
                          </div>
                          <div className="text-emerald-300">
                            <strong>Signed Off By:</strong>{" "}
                            {story.humanVerifiedBy}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <button
                          onClick={() => setReadingStory(story)}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                        >
                          Read Full Story ({story.wordCount} words)
                        </button>

                        <button
                          onClick={() => handleRequestSyndication(story)}
                          className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
                        >
                          Republish in {activeOrg.shortName} (
                          {story.republishCount})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

                  {/* Full Story Reader Modal */}
              {readingStory && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="story-reader-title"
                  className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-2xl max-h-[85dvh] rounded-2xl border border-slate-700 bg-slate-900 p-6 flex flex-col justify-between gap-4 shadow-xl">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-semibold text-teal-300">
                          {readingStory.licenseType}
                        </span>
                        <h3 id="story-reader-title" className="text-lg font-semibold text-slate-100 mt-1">
                          {readingStory.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => setReadingStory(null)}
                        aria-label="Close story reader"
                        className="px-2.5 py-1 rounded-md bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    <div className="overflow-y-auto space-y-4 pr-2 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                      <p className="font-semibold text-slate-100">
                        {readingStory.subtitle}
                      </p>
                      <div>
                        {readingStory.bodyMarkdown || readingStory.excerpt}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-emerald-300">
                        Verified by: {readingStory.humanVerifiedBy}
                      </span>
                      <button
                        onClick={() => {
                          handleRequestSyndication(readingStory);
                          setReadingStory(null);
                        }}
                        className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Republish with Attribution
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. PERMISSIONS & ACTIVITY LOG */}
          {activeNav === "security_audit" && (
            <SecurityAuditView
              auditLogs={auditLogs}
              organisations={organisations}
              investigations={investigations}
              activeOrgId={activeOrgId}
            />
          )}
        </main>
      </div>
    </div>
  );
}
