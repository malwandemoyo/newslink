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
import GeographicMap from "@/components/GeographicMap";
import ResourceDispatchView from "@/components/ResourceDispatchView";
import InvestigationWorkspaceView from "@/components/InvestigationWorkspaceView";
import AICopilotView from "@/components/AICopilotView";
import SecurityAuditView from "@/components/SecurityAuditView";
import {
  LayoutDashboard,
  Radio,
  Users,
  FolderGit2,
  Bot,
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
  Camera,
} from "lucide-react";

type NavSection =
  | "overview"
  | "resources"
  | "expertise"
  | "investigations"
  | "ai_copilot"
  | "news_exchange"
  | "security_audit";

export default function ConnectedNewsroomApp() {
  const [activeNav, setActiveNav] = useState<NavSection>("investigations");
  const [activeOrgId, setActiveOrgId] = useState<string>("org-byo");

  // Server-Backed SQLite State
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

  // Filters & Toast
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dbSynced, setDbSynced] = useState<boolean>(false);

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
    setDbSynced(true);
  }, []);

  // Load initial state from SQLite API
  useEffect(() => {
    fetch("/api/state")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) applyServerState(data);
      })
      .catch(() => {
        // Fallback to seed if offline
      });
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
      triggerToast("Network error communicating with SQLite API");
      return false;
    }
  };

  const handleResetDatabase = async () => {
    await mutateServerState(
      "reset_db",
      {},
      "SQLite database reset to clean seed state."
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
      `Invited ${expert.name} to Project Umzingwane (Saved to SQLite).`
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
        "SAFEGUARD: Tasks cannot enter 'Ready for Exchange' without Human Journalist Sign-Off!"
      );
      return;
    }
    await mutateServerState(
      "move_kanban_task",
      { taskId, newColumn },
      `Moved task to '${newColumn}'.`
    );
  };

  const handleSignOffKanbanTask = async (taskId: string) => {
    await mutateServerState(
      "signoff_kanban_task",
      { taskId },
      `Recorded human editorial verification sign-off in SQLite.`
    );
  };

  const handleAddKanbanTask = async (newTask: Omit<KanbanTask, "id">) => {
    await mutateServerState(
      "add_kanban_task",
      { task: newTask },
      "Added investigation task to Kanban board."
    );
  };

  const handleRequestSyndication = async (story: StoryPackage) => {
    const alreadyRequested = syndicationRequests.some(
      (s) => s.storyId === story.id && s.requestingOrgId === activeOrgId
    );
    if (alreadyRequested) {
      triggerToast(
        `${activeOrg.shortName} already holds an active republication license for this story.`
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
      `Syndication license unlocked for ${activeOrg.name} with mandatory attribution lock.`
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b1120] text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 border border-teal-500/60 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs font-medium leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/90 bg-[#0d1526] flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-sm shadow">
                CN
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                  Connected Newsroom
                </h1>
                <p className="text-[11px] text-teal-400 font-medium mt-1">
                  Stronger newsrooms. Better journalism.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Editorial Independence
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Human journalists verify primary evidence and sign off all publication gates.
            </p>
          </div>

          <nav className="p-3 space-y-1">
            {(
              [
                {
                  id: "overview",
                  label: "Network Overview",
                  icon: LayoutDashboard,
                  badge: `${organisations.length} Orgs`,
                },
                {
                  id: "resources",
                  label: "Resource & Field Dispatch",
                  icon: Radio,
                  badge: `${dispatchBroadcasts.length} Live`,
                },
                {
                  id: "expertise",
                  label: "People & Expertise",
                  icon: Users,
                  badge: `${experts.length}`,
                },
                {
                  id: "investigations",
                  label: "Investigation Repos",
                  icon: FolderGit2,
                  badge: "Git+PR",
                },
                {
                  id: "ai_copilot",
                  label: "AI Research Copilot",
                  icon: Bot,
                  badge: `${documents.length} Docs`,
                },
                {
                  id: "news_exchange",
                  label: "News Exchange",
                  icon: Newspaper,
                  badge: `${stories.length}`,
                },
                {
                  id: "security_audit",
                  label: "ACLs & Audit Log",
                  icon: Shield,
                  badge: `${auditLogs.length}`,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-teal-400" : "text-slate-400"
                      }`}
                    />
                    {item.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-teal-500/20 text-teal-200"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Database Engine</span>
            <span className="text-emerald-400 font-mono text-[10px]">
              ● {dbSynced ? "SQLite WAL Active" : "Connecting..."}
            </span>
          </div>
          <button
            onClick={handleResetDatabase}
            className="w-full py-1.5 px-3 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset SQLite Database
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-800/90 bg-[#0f172a]/90 backdrop-blur px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Active Newsroom:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {organisations.map((org) => {
                const isCurrent = org.id === activeOrgId;
                return (
                  <button
                    key={org.id}
                    onClick={() => {
                      setActiveOrgId(org.id);
                      triggerToast(
                        `Switched active newsroom context to ${org.name} (${org.city}).`
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      isCurrent
                        ? "bg-teal-500 text-slate-950 border-teal-300 font-semibold shadow"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {org.shortName}
                    <span
                      className={`text-[10px] px-1 rounded ${
                        isCurrent
                          ? "bg-slate-950/20 text-slate-950"
                          : "text-slate-400"
                      }`}
                    >
                      {org.city}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              SQLite + Leaflet + File Parser
            </span>
          </div>
        </header>

        <main className="p-5 flex-1 space-y-6 overflow-y-auto">
          {/* 1. OVERVIEW SECTION */}
          {activeNav === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveNav("resources")}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] hover:border-amber-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Live Field Broadcasts</span>
                    <Radio className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {dispatchBroadcasts.length} Active Needs
                  </div>
                  <div className="text-[11px] text-amber-300 mt-1">
                    {dispatchBroadcasts.reduce((a, b) => a + b.bids.length, 0)}{" "}
                    partner bids & counter-offers →
                  </div>
                </div>

                <div
                  onClick={() => setActiveNav("resources")}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] hover:border-teal-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Shared Equipment Pool</span>
                    <Camera className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {resources.filter((r) => r.status === "Available").length} /{" "}
                    {resources.length}
                  </div>
                  <div className="text-[11px] text-teal-300 mt-1">
                    Serialized cameras, drones & studios →
                  </div>
                </div>

                <div
                  onClick={() => setActiveNav("investigations")}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] hover:border-teal-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Investigation Repositories</span>
                    <FolderGit2 className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {kanbanTasks.filter((t) => Boolean(t.signedOffBy)).length} /{" "}
                    {kanbanTasks.length} Verified
                  </div>
                  <div className="text-[11px] text-sky-300 mt-1">
                    Kanban, Evidence Repo & PR Review Gate →
                  </div>
                </div>

                <div
                  onClick={() => setActiveNav("news_exchange")}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] hover:border-teal-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>News Exchange Syndications</span>
                    <Share2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {stories.reduce((acc, s) => acc + s.republishCount, 0)} Licenses
                  </div>
                  <div className="text-[11px] text-emerald-300 mt-1">
                    Attribution & embargoes locked →
                  </div>
                </div>
              </div>

              <GeographicMap
                organisations={organisations}
                resources={resources}
                broadcasts={dispatchBroadcasts}
                experts={experts}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                onRequestResource={() => setActiveNav("resources")}
                onSelectBroadcast={() => setActiveNav("resources")}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {organisations.map((org) => (
                  <div
                    key={org.id}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                      org.id === activeOrgId
                        ? "border-teal-500/60 bg-[#132038]"
                        : "border-slate-800 bg-[#0f172a]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-medium ${org.badgeColor}`}
                        >
                          {org.type}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-400" />
                          {org.city}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{org.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {org.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                      {org.specialties.map((sp) => (
                        <span
                          key={sp}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. RESOURCE & FIELD DISPATCH */}
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
                  "Booking request saved to SQLite & Handover PIN generated!"
                );
              }}
              onCounterOfferRequest={async (payload) => {
                await mutateServerState(
                  "counter_offer_request",
                  payload,
                  `Counter-offer ($${payload.counterRateUsd}/day) sent to requester!`
                );
              }}
              onUpdateResourceRequest={async (payload) => {
                await mutateServerState(
                  "update_resource_request",
                  payload,
                  `Booking updated to '${payload.nextStatus}' with physical condition log.`
                );
              }}
              onCreateBroadcast={async (payload) => {
                await mutateServerState(
                  "create_dispatch_broadcast",
                  payload,
                  `Live field need broadcast to ${payload.city} (${payload.radiusKm}km radius)!`
                );
              }}
              onSubmitBid={async (payload) => {
                await mutateServerState(
                  "submit_dispatch_bid",
                  payload,
                  `Bid / Counter-Offer ($${payload.proposedRateUsd}/day) posted to broadcast!`
                );
              }}
              onAcceptBid={async (payload) => {
                await mutateServerState(
                  "accept_dispatch_bid",
                  payload,
                  "Offer accepted! Dispatch locked & physical Handover PIN generated."
                );
              }}
              onSwitchOrg={(orgId) => {
                setActiveOrgId(orgId);
                const orgObj = organisations.find((o) => o.id === orgId);
                triggerToast(`Switched active newsroom to ${orgObj?.name}.`);
              }}
            />
          )}

          {/* 3. PEOPLE & EXPERTISE NETWORK */}
          {activeNav === "expertise" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Expertise Network & Transparent Specialist Matching
                  </h2>
                  <p className="text-xs text-slate-400">
                    Structured filtering by investigative skill, beat, language, and availability
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                      placeholder="Filter by skill (e.g. Procurement, Drone, Law)..."
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 w-64"
                    />
                  </div>
                  {["All", "English", "Ndebele", "Shona", "Ndau"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguageFilter(lang)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                        languageFilter === lang
                          ? "bg-teal-500 text-slate-950 font-semibold"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-bold text-white">
                                {exp.name}
                              </h3>
                              <p className="text-xs text-teal-300 font-medium">
                                {exp.role}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                                exp.availability === "Available for Collab"
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {exp.availability}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400">
                            {org?.name} • 📍 {exp.city}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {exp.bio}
                          </p>

                          <div className="space-y-1.5 pt-1">
                            <div className="text-[10px] font-semibold uppercase text-slate-400">
                              Verified Specialist Skills
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {exp.skills.map((sk) => (
                                <span
                                  key={sk}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-800"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Languages: {exp.languages.join(", ")}</span>
                            <span>{exp.completedCollabs} Network Collabs</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800">
                          {isCollaborating ? (
                            <div className="w-full py-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Active on Project Umzingwane
                            </div>
                          ) : (
                            <button
                              onClick={() => handleInviteExpert(exp)}
                              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
                            >
                              Invite to Project Umzingwane →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 4. GITHUB-STYLE INVESTIGATION REPOSITORY, DRAG-AND-DROP KANBAN, DRAFT EDITOR & PR REVIEW GATE */}
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
                triggerToast(`Switched active newsroom to ${orgId}.`);
              }}
              onMoveTask={handleMoveKanbanTask}
              onSignOffTask={handleSignOffKanbanTask}
              onAddTask={handleAddKanbanTask}
              onAddTaskComment={async (payload) => {
                await mutateServerState(
                  "add_task_comment",
                  payload,
                  "Verification note & Right-of-Reply status saved to SQLite."
                );
              }}
              onSaveDraft={async (payload) => {
                await mutateServerState(
                  "save_investigation_draft",
                  payload,
                  "Story draft & inline citations saved to SQLite repository."
                );
              }}
              onToggleApproval={async (payload) => {
                await mutateServerState(
                  "toggle_draft_approval",
                  payload,
                  `Updated Pre-Publication Review Gate (${payload.role}).`
                );
              }}
              onPublishToExchange={async (invId) => {
                const ok = await mutateServerState(
                  "publish_draft_to_exchange",
                  { investigationId: invId },
                  "Story Package merged & published to the News Exchange!"
                );
                if (ok) {
                  setActiveNav("news_exchange");
                }
              }}
              onOpenAICopilot={() => setActiveNav("ai_copilot")}
            />
          )}

          {/* 5. AI NEWSROOM COPILOT (With Real File Upload & Citation Insertion) */}
          {activeNav === "ai_copilot" && (
            <AICopilotView
              documents={documents}
              organisations={organisations}
              activeOrgId={activeOrgId}
              onDocumentIndexed={(newState, newDoc) => {
                applyServerState(newState);
                triggerToast(
                  `Parsed & committed "${newDoc.title}" (${newDoc.passages.length} passages, SHA ${newDoc.commitHash}) to SQLite!`
                );
              }}
              onLogAIQuery={(docTitle, mode, q) => {
                mutateServerState("log_audit", {
                  category: "AI Query",
                  actionText: `Executed dynamic passage query ("${q}...") on '${docTitle}' via ${mode}`,
                  resourceTarget: docTitle,
                });
              }}
              onLogHumanVerification={(docTitle, pageNum) => {
                mutateServerState(
                  "log_audit",
                  {
                    category: "Human Verification",
                    actionText: `Journalist verified primary source Page ${pageNum} in '${docTitle}'`,
                    resourceTarget: docTitle,
                  },
                  `Page ${pageNum} marked as Human-Verified in SQLite Audit Log.`
                );
              }}
              onInsertCitationIntoDraft={async (citationTag) => {
                const current = investigationDrafts.find(
                  (d) => d.investigationId === "inv-umzingwane"
                );
                if (!current) return;
                await mutateServerState(
                  "save_investigation_draft",
                  {
                    investigationId: "inv-umzingwane",
                    bodyMarkdown: `${current.bodyMarkdown.trim()}\n\n${citationTag}`,
                  },
                  `Inserted "${citationTag}" into Project Umzingwane Story Draft!`
                );
              }}
            />
          )}

          {/* 6. NEWS EXCHANGE */}
          {activeNav === "news_exchange" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    News Exchange — Story Packages, Licensing & Syndication
                  </h2>
                  <p className="text-xs text-slate-400">
                    Share human-verified story packages across independent newsrooms while preserving originating ownership, embargoes, and attribution terms
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {stories.length} Verified Packages Available
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                      className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            {story.licenseType}
                          </span>
                          <span className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium">
                            <FileCheck className="w-3.5 h-3.5" />
                            {story.embargoLift}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white leading-snug">
                            {story.title}
                          </h3>
                          <p className="text-xs text-slate-300 mt-1">
                            {story.subtitle}
                          </p>
                        </div>

                        <p className="text-xs text-slate-400 italic bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                          “{story.excerpt}”
                        </p>

                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-300">
                            Included Media & Verification Package ({story.wordCount}{" "}
                            words):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {story.mediaIncluded.map((m) => (
                              <span
                                key={m}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-800"
                              >
                                ✓ {m}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                          <div className="text-slate-300">
                            <strong>Originating Newsroom:</strong>{" "}
                            {originOrg?.name}{" "}
                            {coOrgs.length > 0 &&
                              `+ Co-Reported with ${coOrgs.join(", ")}`}
                          </div>
                          <div className="text-teal-300">
                            <strong>Mandatory Attribution:</strong>{" "}
                            {story.attributionRequirement}
                          </div>
                          <div className="text-emerald-300">
                            <strong>Human Verification Sign-Off:</strong>{" "}
                            {story.humanVerifiedBy}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          Republished by{" "}
                          <strong className="text-white">
                            {story.republishCount}
                          </strong>{" "}
                          partner newsrooms
                        </span>

                        <button
                          onClick={() => handleRequestSyndication(story)}
                          className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
                        >
                          Request Syndication License for {activeOrg.shortName} →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. SECURITY ACLs & IMMUTABLE AUDIT LOG */}
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
