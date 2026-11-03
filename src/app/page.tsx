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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b1120] text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-teal-500 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-medium leading-snug">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Left Sidebar Navigation — Clean, Spacious, 6 Human-Friendly Items */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0d1526] flex flex-col justify-between">
        <div>
          {/* Brand Logo */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black text-base shadow-md">
              CN
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">
                Connected Newsroom
              </h1>
              <p className="text-xs text-teal-400 font-medium mt-1">
                Stronger newsrooms.
              </p>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="p-3.5 space-y-1.5">
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-teal-500 text-slate-950 font-bold shadow-md"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-slate-950" : "text-teal-400"
                      }`}
                    />
                    {item.label}
                  </span>
                  {"count" in item && item.count && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? "bg-slate-950/20 text-slate-950"
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
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/30">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Journalists in Control
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              AI assists research and citations. Humans verify facts and approve publication.
            </p>
          </div>

          <button
            onClick={handleResetDatabase}
            className="w-full py-2 px-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar: Active Newsroom Switcher + 4-Step Workflow Progress */}
        <header className="border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 mr-1">
              Viewing as Newsroom:
            </span>
            {organisations.map((org) => {
              const isCurrent = org.id === activeOrgId;
              return (
                <button
                  key={org.id}
                  onClick={() => {
                    setActiveOrgId(org.id);
                    triggerToast(`Now viewing as ${org.name} (${org.city}).`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {org.shortName}
                  <span className="text-[11px] opacity-75">({org.city})</span>
                </button>
              );
            })}
          </div>

          {/* Interactive 4-Step Story Workflow Pills */}
          <div className="hidden xl:flex items-center gap-2 text-xs">
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
            ).map((st) => (
              <button
                key={st.num}
                onClick={() => setActiveNav(st.nav)}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                  activeNav === st.nav
                    ? "bg-teal-500 text-slate-950 border-teal-400 font-bold"
                    : st.done
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {st.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                {st.label}
              </button>
            ))}
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto space-y-8 overflow-y-auto">
          {/* 1. MY NEWSROOM DESK (OVERVIEW) */}
          {activeNav === "overview" && (
            <div className="space-y-8">
              {/* Welcome & Active Story Hero Card */}
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-[#13203a] via-[#0f172a] to-[#0d2229] p-6 lg:p-8 shadow-xl space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      Active Desk: {activeOrg.name} ({activeOrg.city})
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                      Umzingwane River Water & Lithium Tailings Investigation
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Co-reporting with <strong>CITE ZW</strong> and{" "}
                      <strong>Harare Investigative Collective</strong>. Follow the 3 workflow cards below to borrow field gear, verify the public audit report, and publish to the News Wire.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveNav("investigations")}
                    className="px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg cursor-pointer shrink-0 transition"
                  >
                    Open Investigation Workspace{" "}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3 Clear Workflow Cards right inside the Hero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Step Card 1 */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          Step 1 • Field Gear & Crew
                        </span>
                        <Camera className="w-4 h-4 text-amber-400" />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Sony FX6 Camera & Field Crew
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        CITE ZW in Bulawayo has offered their 4K Sony FX6 kit + operator for $25/day fuel cover.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("resources")}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      View Gear & Accept Offer →
                    </button>
                  </div>

                  {/* Step Card 2 */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                          Step 2 • AI Document Research
                        </span>
                        <BookOpen className="w-4 h-4 text-teal-400" />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Verify 2026 EMA Audit Report
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Search the 42-page inspection report with exact page citations and distinguish evidence from allegations.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("investigations")}
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      Search Documents & Cite →
                    </button>
                  </div>

                  {/* Step Card 3 */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Step 3 • Editorial Sign-Off
                        </span>
                        <Share2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Sign Off & Syndicate Story
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {
                          currentDraft?.approvals.filter((a) => a.approved)
                            .length
                        }{" "}
                        of 3 editors have signed off. Approve the final legal check to publish to the News Wire.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("news_exchange")}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      Open News Wire ({stories.length} Stories) →
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Needed From Your Desk (Live Offers & Approvals) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Live Field Dispatch Offers */}
                <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 space-y-4">
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
                      See All →
                    </button>
                  </div>

                  {dispatchBroadcasts.slice(0, 1).map((b) => (
                    <div key={b.id} className="space-y-3">
                      {b.handoverPin && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs">
                          <span className="text-emerald-200 font-semibold flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-emerald-400" />
                            Crew Dispatched! Handover PIN:
                          </span>
                          <span className="font-mono font-black text-sm px-3 py-1 rounded-lg bg-emerald-500 text-slate-950">
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

                {/* Right: Participating Newsrooms in the Network */}
                <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Participating Independent Newsrooms
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click any newsroom to test the platform from their perspective
                    </p>
                  </div>

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
                  "Offer accepted & Handover PIN generated!"
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
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
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
                        className="p-5 rounded-2xl border border-slate-800 bg-[#0f172a] flex flex-col justify-between gap-5 shadow-sm"
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
                            <MapPin className="w-3.5 h-3.5 text-teal-400" />
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
                              <CheckCircle2 className="w-4 h-4" />
                              Collaborating on Umzingwane Story
                            </div>
                          ) : (
                            <button
                              onClick={() => handleInviteExpert(exp)}
                              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
                            >
                              Invite to Investigation →
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
                      className="p-6 rounded-2xl border border-slate-800 bg-[#0f172a] flex flex-col justify-between gap-5 shadow-sm"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            {story.licenseType}
                          </span>
                          <span className="text-xs text-emerald-300 flex items-center gap-1.5 font-semibold">
                            <FileCheck className="w-4 h-4" />
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
                          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
                        >
                          Republish in {activeOrg.shortName} (
                          {story.republishCount}) →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Story Reader Modal */}
              {readingStory && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-teal-500/50 bg-[#0f172a] p-6 flex flex-col justify-between gap-4 shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-semibold text-teal-400">
                          {readingStory.licenseType}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">
                          {readingStory.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => setReadingStory(null)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Close ✕
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
                        Republish with Attribution →
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
