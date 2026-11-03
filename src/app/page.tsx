"use client";

import React, { useState, useEffect } from "react";
import {
  INITIAL_ORGANISATIONS,
  INITIAL_RESOURCES,
  INITIAL_RESOURCE_REQUESTS,
  INITIAL_EXPERTS,
  INITIAL_COLLABORATIONS,
  INITIAL_INVESTIGATIONS,
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
  JournalistProfile,
  CollaborationRequest,
  Investigation,
  KanbanTask,
  KanbanColumnId,
  DocumentRecord,
  StoryPackage,
  SyndicationRequest,
  AuditLogEntry,
} from "@/types/newsroom";
import GeographicMap from "@/components/GeographicMap";
import KanbanBoard from "@/components/KanbanBoard";
import AICopilotView from "@/components/AICopilotView";
import DevOpsArchitectureView from "@/components/DevOpsArchitectureView";
import {
  LayoutDashboard,
  Camera,
  Users,
  FolderGit2,
  Bot,
  Newspaper,
  Server,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Lock,
  Share2,
  MapPin,
  Search,
  FileCheck,
  AlertTriangle,
} from "lucide-react";

type NavSection =
  | "overview"
  | "resources"
  | "expertise"
  | "investigations"
  | "ai_copilot"
  | "news_exchange"
  | "devops";

const DEMO_STEPS = [
  {
    step: 1,
    title: "1. Bulawayo Newsroom Needs Gear",
    desc: "Switch to Matabeleland Independent & search for a 4K camera in Bulawayo.",
    nav: "resources" as NavSection,
    orgId: "org-byo",
  },
  {
    step: 2,
    title: "2. Request CITE ZW Cinema Camera",
    desc: "Request the Sony FX6 Kit on peer-exchange terms.",
    nav: "resources" as NavSection,
    orgId: "org-byo",
  },
  {
    step: 3,
    title: "3. Owner Approves Handover",
    desc: "Switch to CITE ZW Media Hub to approve the camera booking.",
    nav: "resources" as NavSection,
    orgId: "org-cite",
  },
  {
    step: 4,
    title: "4. Match Environmental Data Specialist",
    desc: "Find Tariro Moyo (Harare Collective) & invite her to Project Umzingwane.",
    nav: "expertise" as NavSection,
    orgId: "org-byo",
  },
  {
    step: 5,
    title: "5. Coordinate on Investigation Kanban",
    desc: "Track tasks & human verification sign-offs in the encrypted workspace.",
    nav: "investigations" as NavSection,
    orgId: "org-byo",
  },
  {
    step: 6,
    title: "6. Run Grounded AI Document Research",
    desc: "Query the 42-page EMA Audit Report with exact page citations & evidence badges.",
    nav: "ai_copilot" as NavSection,
    orgId: "org-byo",
  },
  {
    step: 7,
    title: "7. Verify Primary Evidence & Publish",
    desc: "Distribute the human-verified story package on the News Exchange.",
    nav: "news_exchange" as NavSection,
    orgId: "org-byo",
  },
];

export default function ConnectedNewsroomApp() {
  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [activeOrgId, setActiveOrgId] = useState<string>("org-byo");
  const [activeDemoStep, setActiveDemoStep] = useState<number>(1);

  // Stateful Domain Store
  const [organisations] = useState<Organisation[]>(INITIAL_ORGANISATIONS);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(
    INITIAL_RESOURCE_REQUESTS
  );
  const [experts] = useState<JournalistProfile[]>(INITIAL_EXPERTS);
  const [collaborations, setCollaborations] = useState<CollaborationRequest[]>(
    INITIAL_COLLABORATIONS
  );
  const [investigations] = useState<Investigation[]>(INITIAL_INVESTIGATIONS);
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

  // Filters & Modals
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("All");
  const [requestModalResource, setRequestModalResource] =
    useState<Resource | null>(null);
  const [requestPurpose, setRequestPurpose] = useState<string>(
    "Film downstream effluent discharge at Umzingwane Dam Weir #3 and interview community water committee"
  );
  const [requestDates, setRequestDates] = useState<string>(
    "Nov 6 – Nov 9, 2026"
  );
  const [requestTerms, setRequestTerms] = useState<string>(
    "Reciprocal Network Loan ($0 fee + Full CITE ZW visual co-credit)"
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeOrg =
    organisations.find((o) => o.id === activeOrgId) || organisations[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const appendAudit = (
    category: AuditLogEntry["category"],
    action: string,
    resourceTarget: string
  ) => {
    const actorMap: Record<string, string> = {
      "org-byo": "Sipho Ncube",
      "org-cite": "Nqobile Dube",
      "org-hre": "Tariro Moyo",
      "org-mre": "Farai Mutasa",
    };
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actorName: actorMap[activeOrgId] || "Newsroom Editor",
      actorOrgId: activeOrgId,
      category,
      action,
      resourceTarget,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Load persisted state if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem("connected_newsroom_mvp_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.resources) setResources(parsed.resources);
        if (parsed.resourceRequests)
          setResourceRequests(parsed.resourceRequests);
        if (parsed.collaborations) setCollaborations(parsed.collaborations);
        if (parsed.kanbanTasks) setKanbanTasks(parsed.kanbanTasks);
        if (parsed.stories) setStories(parsed.stories);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "connected_newsroom_mvp_v1",
        JSON.stringify({
          resources,
          resourceRequests,
          collaborations,
          kanbanTasks,
          stories,
          auditLogs,
        })
      );
    } catch {
      // Ignore
    }
  }, [
    resources,
    resourceRequests,
    collaborations,
    kanbanTasks,
    stories,
    auditLogs,
  ]);

  const handleResetDemo = () => {
    localStorage.removeItem("connected_newsroom_mvp_v1");
    setResources(INITIAL_RESOURCES);
    setResourceRequests(INITIAL_RESOURCE_REQUESTS);
    setCollaborations(INITIAL_COLLABORATIONS);
    setKanbanTasks(INITIAL_KANBAN_TASKS);
    setDocuments(INITIAL_DOCUMENTS);
    setStories(INITIAL_STORIES);
    setSyndicationRequests(INITIAL_SYNDICATION_REQUESTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setActiveOrgId("org-byo");
    setActiveDemoStep(1);
    triggerToast("Demo state reset to clean starting point.");
  };

  // Resource Request Submission (inDrive-style peer request)
  const handleCreateResourceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalResource) return;

    const newReq: ResourceRequest = {
      id: `req-${Date.now()}`,
      resourceId: requestModalResource.id,
      requesterOrgId: activeOrgId,
      ownerOrgId: requestModalResource.ownerOrgId,
      investigationId: "inv-umzingwane",
      purpose: requestPurpose,
      requestedDates: requestDates,
      proposedTerms: requestTerms,
      status: "Pending Approval",
      createdAt: "2026-11-04 12:05",
    };

    setResourceRequests((prev) => [newReq, ...prev]);
    setResources((prev) =>
      prev.map((r) =>
        r.id === requestModalResource.id ? { ...r, status: "Requested" } : r
      )
    );
    appendAudit(
      "Resource Booking",
      `Requested '${requestModalResource.title}' (${requestDates}) on terms: ${requestTerms}`,
      requestModalResource.id
    );
    setRequestModalResource(null);
    setActiveDemoStep(3);
    triggerToast(
      `Equipment request sent! Switch persona to ${
        organisations.find((o) => o.id === requestModalResource.ownerOrgId)
          ?.shortName
      } to approve handover.`
    );
  };

  // Owner Approves / Hands Over Equipment
  const handleUpdateRequestStatus = (
    reqObj: ResourceRequest,
    nextStatus: ResourceRequest["status"]
  ) => {
    setResourceRequests((prev) =>
      prev.map((r) =>
        r.id === reqObj.id
          ? {
              ...r,
              status: nextStatus,
              conditionOnCheckout:
                nextStatus === "Approved" || nextStatus === "Checked Out"
                  ? "Lens clean, 2x 256GB CFexpress formatted, batteries 100%"
                  : r.conditionOnCheckout,
              conditionOnReturn:
                nextStatus === "Returned"
                  ? "Returned in Excellent condition; zero sensor dust"
                  : r.conditionOnReturn,
            }
          : r
      )
    );

    setResources((prev) =>
      prev.map((res) => {
        if (res.id !== reqObj.resourceId) return res;
        return {
          ...res,
          status:
            nextStatus === "Returned"
              ? "Available"
              : nextStatus === "Approved" || nextStatus === "Checked Out"
              ? "Booked"
              : "Requested",
        };
      })
    );

    appendAudit(
      "Resource Booking",
      `Updated booking ${reqObj.id} status to '${nextStatus}' with condition log`,
      reqObj.resourceId
    );
    triggerToast(`Booking ${nextStatus}! Audit log updated.`);
  };

  // Request Specialist Collaboration
  const handleInviteExpert = (expert: JournalistProfile) => {
    const exists = collaborations.some(
      (c) =>
        c.expertId === expert.id && c.investigationId === "inv-umzingwane"
    );
    if (exists) {
      triggerToast(`${expert.name} is already invited to Project Umzingwane.`);
      return;
    }

    const newCollab: CollaborationRequest = {
      id: `col-${Date.now()}`,
      expertId: expert.id,
      fromOrgId: activeOrgId,
      toOrgId: expert.orgId,
      investigationId: "inv-umzingwane",
      roleRequested: `Specialist Collaboration: ${expert.skills[0]}`,
      scopeNote:
        "Cross-reference procurement ledger #URDC-2026-09 and verify EMA water sample tables.",
      status: "Accepted",
      createdAt: "2026-11-04 12:08",
    };

    setCollaborations((prev) => [newCollab, ...prev]);
    appendAudit(
      "Investigation ACL",
      `Invited specialist ${expert.name} (${expert.role}) to PROJECT UMZINGWANE`,
      "inv-umzingwane"
    );
    setActiveDemoStep(5);
    triggerToast(
      `Collaboration request accepted! ${expert.name} added to Project Umzingwane.`
    );
  };

  // Kanban Handlers
  const handleMoveKanbanTask = (
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
    setKanbanTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: newColumn } : t))
    );
    if (targetTask) {
      appendAudit(
        "Human Verification",
        `Moved task '${targetTask.title}' to stage '${newColumn}'`,
        targetTask.investigationId
      );
    }
  };

  const handleSignOffKanbanTask = (taskId: string) => {
    const actorMap: Record<string, string> = {
      "org-byo": "Sipho Ncube (Matabeleland Ind.)",
      "org-cite": "Nqobile Dube (CITE ZW)",
      "org-hre": "Tariro Moyo (Harare Collective)",
      "org-mre": "Farai Mutasa (Manicaland Wire)",
    };
    const signer = actorMap[activeOrgId] || "Verified Editor";
    setKanbanTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, signedOffBy: signer } : t))
    );
    appendAudit(
      "Human Verification",
      `Recorded human primary-source verification sign-off on task ${taskId}`,
      "inv-umzingwane"
    );
    triggerToast(`Human verification recorded by ${signer}.`);
  };

  const handleAddKanbanTask = (newTask: Omit<KanbanTask, "id">) => {
    const created: KanbanTask = {
      ...newTask,
      id: `task-${Date.now()}`,
    };
    setKanbanTasks((prev) => [created, ...prev]);
    appendAudit(
      "Investigation ACL",
      `Created investigation task '${created.title}' assigned to ${created.assigneeName}`,
      created.investigationId
    );
    triggerToast("New investigation task added to Kanban board.");
  };

  // Syndication Request Handler
  const handleRequestSyndication = (story: StoryPackage) => {
    const alreadyRequested = syndicationRequests.some(
      (s) => s.storyId === story.id && s.requestingOrgId === activeOrgId
    );
    if (alreadyRequested) {
      triggerToast(
        `Your newsroom (${activeOrg.shortName}) already holds an active republication license for this story.`
      );
      return;
    }
    const newSyn: SyndicationRequest = {
      id: `syn-${Date.now()}`,
      storyId: story.id,
      requestingOrgId: activeOrgId,
      originOrgId: story.originOrgId,
      status: "Approved",
      plannedPublishDate: "2026-11-05 06:00 CAT",
      agreedAttribution: story.attributionRequirement,
    };
    setSyndicationRequests((prev) => [newSyn, ...prev]);
    setStories((prev) =>
      prev.map((s) =>
        s.id === story.id ? { ...s, republishCount: s.republishCount + 1 } : s
      )
    );
    appendAudit(
      "Story Syndication",
      `Granted republication license for '${story.title}' with mandatory attribution metadata`,
      story.id
    );
    triggerToast(
      `Syndication package unlocked for ${activeOrg.name} with attribution lock!`
    );
  };

  const selectedInvestigation =
    investigations.find((i) => i.id === selectedInvestigationId) ||
    investigations[0];
  const isAuthorisedForInvestigation =
    selectedInvestigation.leadOrgId === activeOrgId ||
    selectedInvestigation.partnerOrgIds.includes(activeOrgId);

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
          {/* Brand Header */}
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

          {/* Principle Badge */}
          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Editorial Safeguard Active
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              AI assists research & citations. Humans verify evidence and control publication.
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            {(
              [
                {
                  id: "overview",
                  label: "Overview & Demo Flow",
                  icon: LayoutDashboard,
                  badge: "Start",
                },
                {
                  id: "resources",
                  label: "Resource Exchange",
                  icon: Camera,
                  badge: `${
                    resources.filter((r) => r.status === "Available").length
                  } Avail`,
                },
                {
                  id: "expertise",
                  label: "People & Expertise",
                  icon: Users,
                  badge: `${experts.length}`,
                },
                {
                  id: "investigations",
                  label: "Investigations & Kanban",
                  icon: FolderGit2,
                  badge: "ACL",
                },
                {
                  id: "ai_copilot",
                  label: "AI Newsroom Copilot",
                  icon: Bot,
                  badge: "RAG",
                },
                {
                  id: "news_exchange",
                  label: "News Exchange",
                  icon: Newspaper,
                  badge: `${stories.length}`,
                },
                {
                  id: "devops",
                  label: "DevOps & OSS Stack",
                  icon: Server,
                  badge: "Infra",
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

        {/* Bottom Demo Reset & Active Status */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Demo Persistence</span>
            <span className="text-emerald-400 font-mono text-[10px]">
              ● Local Adapter Active
            </span>
          </div>
          <button
            onClick={handleResetDemo}
            className="w-full py-1.5 px-3 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Journey
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header: Active Newsroom Persona Switcher */}
        <header className="border-b border-slate-800/90 bg-[#0f172a]/90 backdrop-blur px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Active Newsroom Context:</span>
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
              Role: Editorial & Investigative Lead
            </span>
          </div>
        </header>

        {/* Guided Interactive Demo Strip ("A Story That Takes a Network") */}
        <div className="bg-[#111b30] border-b border-slate-800 px-5 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Pitch Journey: “A Story That Takes a Network” (Click any step)
            </span>
            <span className="text-[11px] text-slate-400">
              GitHub + Kanban + inDrive for Independent Journalism
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {DEMO_STEPS.map((ds) => {
              const isCurrentStep = activeDemoStep === ds.step;
              return (
                <button
                  key={ds.step}
                  onClick={() => {
                    setActiveDemoStep(ds.step);
                    setActiveNav(ds.nav);
                    setActiveOrgId(ds.orgId);
                  }}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    isCurrentStep
                      ? "bg-teal-500/20 border-teal-400 text-white"
                      : "bg-slate-900/70 border-slate-800/90 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="text-[11px] font-semibold leading-tight truncate">
                    {ds.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {ds.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Workspace Body */}
        <main className="p-5 flex-1 space-y-6 overflow-y-auto">
          {/* 1. OVERVIEW SECTION */}
          {activeNav === "overview" && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#111c35] via-[#0f172a] to-[#0d1f2d] p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-medium">
                    Open-Source Collaboration Infrastructure • Active Context:{" "}
                    <strong>{activeOrg.name}</strong>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                    Shared infrastructure for independent journalism—without surrendering editorial independence.
                  </h2>
                  <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
                    Share field cameras and studios peer-to-peer (<strong>inDrive model</strong>), coordinate cross-newsroom investigations on verification boards (<strong>Kanban model</strong>), and research primary documents with grounded AI citations and strict access controls (<strong>GitHub / Aleph model</strong>).
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <button
                    onClick={() => {
                      setActiveDemoStep(1);
                      setActiveNav("resources");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    Launch Step 1: Request Camera <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveNav("ai_copilot")}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-teal-400" />
                    Open Grounded AI Copilot
                  </button>
                </div>
              </div>

              {/* Network Intelligence Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    Available across Bulawayo & Harare →
                  </div>
                </div>

                <div
                  onClick={() => setActiveNav("expertise")}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] hover:border-teal-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Verified Specialist Network</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {experts.length} Specialists
                  </div>
                  <div className="text-[11px] text-sky-300 mt-1">
                    Data forensics, drone, legal & radio →
                  </div>
                </div>

                <div
                  onClick={() => setActiveNav("investigations")}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] hover:border-teal-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Active Co-Investigations</span>
                    <FolderGit2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {
                      kanbanTasks.filter((t) => Boolean(t.signedOffBy)).length
                    }{" "}
                    / {kanbanTasks.length} Tasks
                  </div>
                  <div className="text-[11px] text-amber-300 mt-1">
                    Human-verified on Kanban board →
                  </div>
                </div>

                <div
                  onClick={() => setActiveNav("news_exchange")}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] hover:border-teal-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>News Exchange Packages</span>
                    <Share2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {stories.reduce((acc, s) => acc + s.republishCount, 0)} Syndications
                  </div>
                  <div className="text-[11px] text-emerald-300 mt-1">
                    Attribution & licensing preserved →
                  </div>
                </div>
              </div>

              {/* Geographic Resource Discovery Map right on Overview */}
              <GeographicMap
                organisations={organisations}
                resources={resources}
                experts={experts}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                onRequestResource={(res) => {
                  setRequestModalResource(res);
                  setActiveNav("resources");
                }}
              />

              {/* Participating Independent Newsrooms */}
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

          {/* 2. RESOURCE EXCHANGE (inDrive-style Peer Sharing + Approval Flow) */}
          {activeNav === "resources" && (
            <div className="space-y-6">
              <GeographicMap
                organisations={organisations}
                resources={resources}
                experts={experts}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                onRequestResource={(res) => setRequestModalResource(res)}
              />

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Peer-to-Peer Equipment & Facility Exchange
                  </h2>
                  <p className="text-xs text-slate-400">
                    Request idle cameras, audio recorders, drones, and studios directly from partner newsrooms with logged handover condition checks
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    "All",
                    "Camera & Optics",
                    "Audio & Podcast",
                    "Studio & Edit Bay",
                    "Drone & Environmental Sensor",
                    "Field Vehicle & Power",
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-teal-500 text-slate-950 font-semibold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources
                  .filter(
                    (r) =>
                      (selectedCity === "All" || r.city === selectedCity) &&
                      (selectedCategory === "All" ||
                        r.category === selectedCategory)
                  )
                  .map((res) => {
                    const owner = organisations.find(
                      (o) => o.id === res.ownerOrgId
                    );
                    const isOwnGear = res.ownerOrgId === activeOrgId;

                    return (
                      <div
                        key={res.id}
                        className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] flex flex-col justify-between gap-4 hover:border-slate-700 transition"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                              {res.category}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                res.status === "Available"
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : res.status === "Requested"
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                              }`}
                            >
                              {res.status}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-100 leading-snug">
                            {res.title}
                          </h3>

                          <div className="text-xs text-slate-400 flex items-center justify-between">
                            <span>
                              Owner:{" "}
                              <strong className="text-slate-200">
                                {owner?.name}
                              </strong>
                            </span>
                            <span className="text-teal-300 font-medium">
                              📍 {res.city}
                            </span>
                          </div>

                          <ul className="space-y-1 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                            {res.specs.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>

                          <div className="text-[11px] space-y-1 pt-1">
                            <div className="text-slate-300">
                              <span className="text-slate-400">Peer Terms:</span>{" "}
                              {res.dailyTerms}
                            </div>
                            <div className="text-slate-400">
                              Window: {res.availableWindow} • Condition:{" "}
                              <span className="text-emerald-300">
                                {res.condition}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                          {isOwnGear ? (
                            <span className="text-[11px] text-slate-400 italic">
                              Owned by your active newsroom ({activeOrg.shortName})
                            </span>
                          ) : res.status === "Available" ? (
                            <button
                              onClick={() => setRequestModalResource(res)}
                              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
                            >
                              Request Equipment Booking →
                            </button>
                          ) : (
                            <span className="text-xs text-amber-300 font-medium">
                              Currently {res.status} (See Booking Queue Below)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Request Modal */}
              {requestModalResource && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <form
                    onSubmit={handleCreateResourceRequest}
                    className="w-full max-w-lg rounded-2xl border border-teal-500/50 bg-[#0f172a] p-5 space-y-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-teal-400">
                          Peer-to-Peer Equipment Booking Request
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">
                          {requestModalResource.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRequestModalResource(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Requesting Newsroom:</span>
                        <strong className="text-teal-300">{activeOrg.name}</strong>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Editorial Purpose / Investigation Assignment
                        </label>
                        <input
                          type="text"
                          required
                          value={requestPurpose}
                          onChange={(e) => setRequestPurpose(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Requested Dates
                          </label>
                          <input
                            type="text"
                            required
                            value={requestDates}
                            onChange={(e) => setRequestDates(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Proposed Exchange / Credit Terms
                          </label>
                          <input
                            type="text"
                            required
                            value={requestTerms}
                            onChange={(e) => setRequestTerms(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRequestModalResource(null)}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs cursor-pointer"
                      >
                        Submit Booking Request
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Active Bookings, Approvals & Handover Checklist Table */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Equipment Bookings, Approvals & Handover Condition Ledger
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Switch active newsroom to <strong>CITE ZW</strong> or <strong>Harare Collective</strong> in the top bar to approve requests and log returns
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {resourceRequests.map((req) => {
                    const resItem = resources.find(
                      (r) => r.id === req.resourceId
                    );
                    const requester = organisations.find(
                      (o) => o.id === req.requesterOrgId
                    );
                    const owner = organisations.find(
                      (o) => o.id === req.ownerOrgId
                    );
                    const canManage = activeOrgId === req.ownerOrgId;

                    return (
                      <div
                        key={req.id}
                        className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {resItem?.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold">
                              {req.status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {requester?.shortName} → {owner?.shortName} (
                              {req.requestedDates})
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            Purpose: {req.purpose} •{" "}
                            <span className="text-teal-300">
                              Terms: {req.proposedTerms}
                            </span>
                          </p>
                          {(req.conditionOnCheckout ||
                            req.conditionOnReturn) && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              {req.conditionOnCheckout &&
                                `Checkout Log: ${req.conditionOnCheckout}`}{" "}
                              {req.conditionOnReturn &&
                                `| Return Log: ${req.conditionOnReturn}`}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {canManage ? (
                            <>
                              {req.status === "Pending Approval" && (
                                <button
                                  onClick={() =>
                                    handleUpdateRequestStatus(req, "Approved")
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs cursor-pointer"
                                >
                                  Approve & Log Handover ✓
                                </button>
                              )}
                              {req.status === "Approved" && (
                                <button
                                  onClick={() =>
                                    handleUpdateRequestStatus(req, "Returned")
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer"
                                >
                                  Log Equipment Return ✓
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveOrgId(req.ownerOrgId);
                                triggerToast(
                                  `Switched to ${owner?.shortName} so you can approve this booking.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs cursor-pointer"
                            >
                              Switch to {owner?.shortName} to Approve →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
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
                    Structured filtering by investigative skill, beat, language, and availability before semantic ranking
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

          {/* 4. COLLABORATIVE INVESTIGATIONS & KANBAN WORKSPACE */}
          {activeNav === "investigations" && (
            <div className="space-y-5">
              {/* Investigation Switcher (Demonstrating Private by Default ACLs) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investigations.map((inv) => {
                  const hasAccess =
                    inv.leadOrgId === activeOrgId ||
                    inv.partnerOrgIds.includes(activeOrgId);
                  const isSelected = inv.id === selectedInvestigationId;
                  const leadOrg = organisations.find(
                    (o) => o.id === inv.leadOrgId
                  );

                  return (
                    <button
                      key={inv.id}
                      onClick={() => setSelectedInvestigationId(inv.id)}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? "border-teal-500 bg-[#14223c]"
                          : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-mono font-bold text-teal-400">
                          {inv.codeName}
                        </span>
                        {hasAccess ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Authorised Member
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Private to {leadOrg?.shortName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        {inv.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {inv.summary}
                      </p>
                    </button>
                  );
                })}
              </div>

              {!isAuthorisedForInvestigation ? (
                <div className="p-8 rounded-xl border border-rose-500/40 bg-rose-950/20 text-center space-y-3">
                  <Lock className="w-10 h-10 text-rose-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">
                    Encrypted Workspace — Access Restricted by Default
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto">
                    <strong>{selectedInvestigation.codeName}</strong> is private to{" "}
                    <strong>Harare Investigative Collective</strong>. Connected Newsroom never shares unpublished investigations across organisations without explicit project membership.
                  </p>
                  <button
                    onClick={() => setActiveOrgId("org-hre")}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    Switch Persona to Harare Collective to Inspect →
                  </button>
                </div>
              ) : (
                <>
                  {/* Investigation Agreement & Partner Metadata */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-[#11192d] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {selectedInvestigation.codeName}:{" "}
                          {selectedInvestigation.title}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded">
                        Embargo Until: {selectedInvestigation.embargoUntil}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong className="text-teal-300">
                        Signed Editorial & Attribution Agreement:
                      </strong>{" "}
                      {selectedInvestigation.editorialAgreement}
                    </p>
                  </div>

                  {/* Interactive Kanban Board */}
                  <KanbanBoard
                    tasks={kanbanTasks.filter(
                      (t) => t.investigationId === selectedInvestigation.id
                    )}
                    organisations={organisations}
                    activeOrgId={activeOrgId}
                    onMoveTask={handleMoveKanbanTask}
                    onSignOffTask={handleSignOffKanbanTask}
                    onAddTask={handleAddKanbanTask}
                    investigationId={selectedInvestigation.id}
                  />
                </>
              )}
            </div>
          )}

          {/* 5. AI NEWSROOM COPILOT */}
          {activeNav === "ai_copilot" && (
            <AICopilotView
              documents={documents}
              organisations={organisations}
              activeOrgId={activeOrgId}
              onUploadDocument={(newDoc) => {
                setDocuments((prev) => [newDoc, ...prev]);
                appendAudit(
                  "Investigation ACL",
                  `Uploaded & indexed document '${newDoc.title}' with policy '${newDoc.aiConsentStatus}'`,
                  newDoc.id
                );
                triggerToast(
                  `Document "${newDoc.title}" indexed with entity extraction!`
                );
              }}
              onLogAIQuery={(docTitle, mode, q) => {
                appendAudit(
                  "AI Query",
                  `Executed grounded query ("${q}...") on '${docTitle}' via ${mode}`,
                  docTitle
                );
              }}
              onLogHumanVerification={(docTitle, pageNum) => {
                appendAudit(
                  "Human Verification",
                  `Journalist inspected and verified primary source Page ${pageNum} in '${docTitle}'`,
                  docTitle
                );
                triggerToast(
                  `Page ${pageNum} marked as Human-Verified in the immutable audit log.`
                );
              }}
            />
          )}

          {/* 6. NEWS EXCHANGE (Superdesk-Style Content Distribution) */}
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
                  Human Editorial Sign-Off Enforced
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

          {/* 7. DEVOPS & OPEN-SOURCE ARCHITECTURE */}
          {activeNav === "devops" && (
            <DevOpsArchitectureView
              auditLogs={auditLogs}
              organisations={organisations}
            />
          )}
        </main>
      </div>
    </div>
  );
}
