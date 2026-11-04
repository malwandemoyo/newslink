import { NextRequest, NextResponse } from "next/server";
import {
  getFullWorkspaceState,
  getCollection,
  setCollection,
  insertAuditLog,
  resetSqliteDatabase,
  recordLedgerTransaction,
} from "@/lib/db";
import {
  INITIAL_ORGANISATIONS,
  INITIAL_INVESTIGATIONS,
  INITIAL_RESOURCES,
  INITIAL_RESOURCE_REQUESTS,
  INITIAL_DISPATCH_BROADCASTS,
  INITIAL_COLLABORATIONS,
  INITIAL_KANBAN_TASKS,
  INITIAL_INVESTIGATION_DRAFTS,
  INITIAL_DOCUMENTS,
  INITIAL_STORIES,
  INITIAL_SYNDICATION_REQUESTS,
} from "@/data/seed";
import {
  Organisation,
  Investigation,
  Resource,
  ResourceRequest,
  DispatchBroadcast,
  DispatchBid,
  CollaborationRequest,
  KanbanTask,
  InvestigationDraft,
  DocumentRecord,
  StoryPackage,
  SyndicationRequest,
  AuditLogEntry,
} from "@/types/newsroom";

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

async function callGeminiJson<T>(prompt: string, fallback: T): Promise<T> {
  if (!GEMINI_API_KEY) return fallback;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(7000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) return JSON.parse(raw) as T;
    }
  } catch {
    // Fallback on network error
  }
  return fallback;
}

const ACTOR_BY_ORG: Record<string, string> = {
  "org-byo": "Sipho Ncube",
  "org-cite": "Nqobile Dube",
  "org-hre": "Tariro Moyo",
  "org-mre": "Farai Mutasa",
};

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function recordAudit(
  actorOrgId: string,
  category: AuditLogEntry["category"],
  action: string,
  resourceTarget: string
) {
  insertAuditLog({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: nowStamp(),
    actorName: ACTOR_BY_ORG[actorOrgId] || "Newsroom Editor",
    actorOrgId,
    category,
    action,
    resourceTarget,
  });
}

export async function GET() {
  try {
    const state = getFullWorkspaceState();
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load SQLite state" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, activeOrgId = "org-byo", payload } = body;

    if (action === "reset_db") {
      const resetState = resetSqliteDatabase();
      return NextResponse.json(resetState);
    }

    // 0A. Register New Media Organisation (Demo Journey #1)
    if (action === "register_organisation") {
      const orgs = getCollection<Organisation[]>(
        "organisations",
        INITIAL_ORGANISATIONS
      );
      const city = payload.city || "Bulawayo";
      const cityCoords: Record<string, { lat: number; lng: number }> = {
        Bulawayo: { lat: -20.154, lng: 28.585 },
        Harare: { lat: -17.829, lng: 31.052 },
        Mutare: { lat: -18.972, lng: 32.669 },
        Gweru: { lat: -19.45, lng: 29.817 },
      };
      const newOrg: Organisation = {
        id: `org-${Date.now().toString(36)}`,
        name: payload.name,
        shortName: payload.shortName || payload.name.slice(0, 16),
        type: "Community Newsroom",
        city,
        country: "Zimbabwe",
        coordinates: cityCoords[city] || cityCoords.Bulawayo,
        verified: true,
        memberCount: 8,
        specialties: payload.beats || [
          "Investigative Reporting",
          "Public Interest",
        ],
        badgeColor: "teal",
        description:
          payload.description ||
          "Independent media organisation retaining 100% editorial independence and copyright control.",
      };
      setCollection("organisations", [...orgs, newOrg]);
      recordLedgerTransaction({
        fromOrgId: null,
        toOrgId: newOrg.id,
        category: "Onboarding Escrow Grant",
        description: `Initial $300 USD Escrow + 120 Network Credits activated for ${newOrg.name}`,
        grossAmountUsd: 300,
        creditsMoved: 120,
        paymentRail: "NewsLink Network Grant",
        referenceId: newOrg.id,
      });
      recordAudit(
        newOrg.id,
        "Investigation ACL",
        `Registered media organisation '${newOrg.name}' (${newOrg.city}) with $300 USD + 120 Credits wallet`,
        newOrg.id
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 0B. List New Camera / Equipment with Gemini AI Pricing (Demo Journey #2)
    if (action === "create_resource") {
      const resources = getCollection<Resource[]>("resources", INITIAL_RESOURCES);
      const city = payload.city || "Bulawayo";
      const cityCoords: Record<string, { lat: number; lng: number }> = {
        Bulawayo: { lat: -20.153, lng: 28.581 },
        Harare: { lat: -17.826, lng: 31.045 },
        Mutare: { lat: -18.973, lng: 32.671 },
      };

      const aiPricing = await callGeminiJson(
        `Suggest a fair peer-to-peer daily rental rate in USD (between 15 and 75) for a newsroom in ${city} lending "${payload.title}" (${payload.category}). Return strictly JSON: {"suggestedRateUsd": number, "rationale": "short string"}`,
        {
          suggestedRateUsd: Number(payload.suggestedRateUsd || 35),
          rationale: "AI peer-to-peer newsroom rate (~60% below commercial rental)",
        }
      );

      const newRes: Resource = {
        id: `res-${Date.now()}`,
        title: payload.title,
        serialNumber: `CN-${Math.floor(1000 + Math.random() * 9000)}`,
        category: payload.category || "Camera & Optics",
        ownerOrgId: activeOrgId,
        city,
        coordinates: cityCoords[city] || cityCoords.Bulawayo,
        status: "Available",
        condition: "Excellent",
        suggestedRateUsd:
          Number(payload.suggestedRateUsd) || aiPricing.suggestedRateUsd,
        dailyTerms:
          payload.sharingTerms ||
          `${aiPricing.rationale} • Reciprocal Network Credits accepted`,
        collateralRequirement: "Partner Newsroom MoU + PIN Handover",
        specs: payload.specs || [
          "Verified Newsroom Asset",
          "Ready for Field Dispatch",
        ],
        availableWindow: "Immediate — Available Today",
      };

      setCollection("resources", [newRes, ...resources]);
      recordAudit(
        activeOrgId,
        "Resource Booking",
        `Listed equipment '${newRes.title}' ($${newRes.suggestedRateUsd}/day via Gemini pricing)`,
        newRes.id
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 0C. Create New Shared Investigation + Gemini AI Initial Kanban Tasks (Demo Journey #4)
    if (action === "create_investigation") {
      const investigations = getCollection<Investigation[]>(
        "investigations",
        INITIAL_INVESTIGATIONS
      );
      const drafts = getCollection<InvestigationDraft[]>(
        "investigation_drafts",
        INITIAL_INVESTIGATION_DRAFTS
      );
      const tasks = getCollection<KanbanTask[]>(
        "kanban_tasks",
        INITIAL_KANBAN_TASKS
      );

      const invId = `inv-${Date.now().toString(36)}`;
      const codeName =
        payload.codeName ||
        `PROJECT ${payload.title.split(" ")[0].toUpperCase()}`;
      const newInv: Investigation = {
        id: invId,
        codeName,
        repoSlug: codeName.toLowerCase().replace(/\s+/g, "-"),
        title: payload.title,
        summary:
          payload.summary ||
          "Cross-newsroom collaborative investigation with shared document RAG and 3-gate editorial verification.",
        leadOrgId: activeOrgId,
        partnerOrgIds: payload.partnerOrgIds || ["org-cite", "org-hre"],
        visibility: "Partner Network Only",
        status: "Active Reporting",
        createdAt: nowStamp(),
        embargoUntil: payload.embargoUntil || "2026-11-15 06:00 CAT",
        editorialAgreement:
          "Shared co-byline & 48-hour Right-of-Reply required prior to publication.",
      };

      const aiTasks = await callGeminiJson<{
        tasks: Array<{
          title: string;
          description: string;
          column: KanbanTask["column"];
          priority: KanbanTask["priority"];
        }>;
      }>(
        `Generate 3 investigative journalism verification tasks for "${newInv.title}" (${newInv.summary}). Return strictly JSON: {"tasks": [{"title": "string", "description": "string", "column": "leads" | "verification" | "fieldwork", "priority": "High" | "Medium"}]}`,
        {
          tasks: [
            {
              title: `Obtain primary procurement & audit records for ${newInv.codeName}`,
              description:
                "Upload official PDFs to the investigation repo and run Gemini citation extraction.",
              column: "verification",
              priority: "High",
            },
            {
              title: "Dispatch partner field crew for on-site visual corroboration",
              description:
                "Book camera/drone via inDrive Resource Exchange and log geotagged evidence.",
              column: "fieldwork",
              priority: "High",
            },
          ],
        }
      );

      const createdTasks: KanbanTask[] = (aiTasks.tasks || []).map((t, i) => ({
        id: `task-${Date.now()}-${i}`,
        investigationId: invId,
        title: t.title,
        description: t.description,
        column:
          t.column === "leads" ||
          t.column === "verification" ||
          t.column === "fieldwork"
            ? t.column
            : "verification",
        assigneeOrgId:
          i % 2 === 0
            ? activeOrgId
            : newInv.partnerOrgIds[0] || activeOrgId,
        assigneeName: "AI-Generated Verification Task",
        priority: t.priority === "High" || t.priority === "Medium" ? t.priority : "High",
        evidenceRef: "Pending Primary Upload",
        rightOfReplyStatus: "Dispatched (72h Window)",
        requiresHumanSignoff: true,
        comments: [],
      }));

      const newDraft: InvestigationDraft = {
        investigationId: invId,
        headline: `${newInv.title} — Collaborative Investigation Draft`,
        subheadline: newInv.summary,
        bodyMarkdown: `### Executive Findings\n\nCollaborating newsrooms initialized **${newInv.codeName}**. Upload primary source documents in Step 1 and click **+ Add Quote & Cite in Story** to populate verified evidence.\n`,
        licenseType: "CC BY-NC-ND 4.0 (Network Attribution)",
        attributionText: `Joint investigation by ${newInv.codeName} Partner Network.`,
        lastUpdatedAt: nowStamp(),
        mediaAssets: ["Primary Document Bundle"],
        approvals: [
          {
            role: "Lead Editor",
            orgId: activeOrgId,
            reviewerName: ACTOR_BY_ORG[activeOrgId] || "Lead Editor",
            approved: false,
            note: "Awaiting primary citations",
          },
          {
            role: "Partner Data Desk",
            orgId: newInv.partnerOrgIds[0] || "org-cite",
            reviewerName: "Partner Editor",
            approved: false,
            note: "Awaiting field verification",
          },
          {
            role: "Pre-Publication Legal",
            orgId: "org-hre",
            reviewerName: "Legal Review Desk",
            approved: false,
            note: "Awaiting 48-hour Right-of-Reply check",
          },
        ],
      };

      setCollection("investigations", [newInv, ...investigations]);
      setCollection("investigation_drafts", [newDraft, ...drafts]);
      setCollection("kanban_tasks", [...createdTasks, ...tasks]);

      recordAudit(
        activeOrgId,
        "Investigation ACL",
        `Created shared investigation '${newInv.codeName}' + generated ${createdTasks.length} AI verification tasks`,
        invId
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 0D. Gemini AI Kanban Task Generator for Active Investigation
    if (action === "ai_generate_kanban_tasks") {
      const investigations = getCollection<Investigation[]>(
        "investigations",
        INITIAL_INVESTIGATIONS
      );
      const tasks = getCollection<KanbanTask[]>(
        "kanban_tasks",
        INITIAL_KANBAN_TASKS
      );
      const inv =
        investigations.find((i) => i.id === payload.investigationId) ||
        investigations[0];

      const aiGenerated = await callGeminiJson<{
        tasks: Array<{
          title: string;
          description: string;
          column: KanbanTask["column"];
          priority: KanbanTask["priority"];
          evidenceRef: string;
        }>;
      }>(
        `You are the NewsLink Editorial Kanban AI. Generate 2 new concrete verification tasks for the investigation "${inv.title}" (${inv.summary}). Return strictly JSON: {"tasks": [{"title": "string", "description": "string", "column": "leads" | "verification" | "fieldwork" | "editorial_review", "priority": "High" | "Medium", "evidenceRef": "string"}]}`,
        {
          tasks: [
            {
              title:
                "Cross-verify beneficial ownership filings against tender bank disbursements",
              description:
                "Match CR14 company directors with Auditor-General payment vouchers.",
              column: "verification",
              priority: "High",
              evidenceRef: "Auditor-General Report p. 47",
            },
            {
              title: "Log 48-hour Right-of-Reply response from named contractor",
              description:
                "Attach timestamped email delivery receipt and written response before legal sign-off.",
              column: "editorial_review",
              priority: "High",
              evidenceRef: "Legal Pre-Publication Gate",
            },
          ],
        }
      );

      const newTasks: KanbanTask[] = (aiGenerated.tasks || []).map((t, idx) => ({
        id: `task-ai-${Date.now()}-${idx}`,
        investigationId: inv.id,
        title: `✨ [Gemini Task] ${t.title}`,
        description: t.description,
        column:
          t.column === "leads" ||
          t.column === "verification" ||
          t.column === "fieldwork" ||
          t.column === "editorial_review"
            ? t.column
            : "verification",
        assigneeOrgId: activeOrgId,
        assigneeName: `${ACTOR_BY_ORG[activeOrgId] || "Editor"} (AI Assisted)`,
        priority: t.priority === "High" || t.priority === "Medium" ? t.priority : "High",
        evidenceRef: t.evidenceRef || "Primary Source Repo",
        rightOfReplyStatus: "Dispatched (72h Window)",
        requiresHumanSignoff: true,
        comments: [],
      }));

      setCollection("kanban_tasks", [...newTasks, ...tasks]);
      recordAudit(
        activeOrgId,
        "AI Query",
        `Generated ${newTasks.length} verification tasks on Kanban board via ${GEMINI_MODEL}`,
        inv.id
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 1. Direct Equipment Booking Request
    if (action === "create_resource_request") {
      const resources = getCollection<Resource[]>("resources", INITIAL_RESOURCES);
      const requests = getCollection<ResourceRequest[]>(
        "resource_requests",
        INITIAL_RESOURCE_REQUESTS
      );
      const targetRes = resources.find((r) => r.id === payload.resourceId);
      if (!targetRes) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      }

      const pin = `CN-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReq: ResourceRequest = {
        id: `req-${Date.now()}`,
        resourceId: targetRes.id,
        requesterOrgId: activeOrgId,
        ownerOrgId: targetRes.ownerOrgId,
        investigationId: "inv-umzingwane",
        purpose: payload.purpose,
        requestedDates: payload.requestedDates,
        proposedTerms: payload.proposedTerms,
        offeredRateUsd: Number(payload.offeredRateUsd || 0),
        status: "Pending Approval",
        handoverPin: pin,
        createdAt: nowStamp(),
      };

      setCollection("resource_requests", [newReq, ...requests]);
      setCollection(
        "resources",
        resources.map((r) =>
          r.id === targetRes.id ? { ...r, status: "Requested" } : r
        )
      );
      recordAudit(
        activeOrgId,
        "Resource Booking",
        `Requested '${targetRes.title}' (${newReq.requestedDates}) at $${newReq.offeredRateUsd}/day — Terms: ${newReq.proposedTerms}`,
        targetRes.id
      );

      return NextResponse.json(getFullWorkspaceState());
    }

    // 2. Owner Sends Counter-Offer on Direct Equipment Booking
    if (action === "counter_offer_request") {
      const requests = getCollection<ResourceRequest[]>(
        "resource_requests",
        INITIAL_RESOURCE_REQUESTS
      );
      const updated = requests.map((r) =>
        r.id === payload.requestId
          ? {
              ...r,
              status: "Counter-Offer Sent" as const,
              counterOfferTerms: payload.counterOfferTerms,
              counterRateUsd: Number(payload.counterRateUsd ?? r.offeredRateUsd),
            }
          : r
      );
      setCollection("resource_requests", updated);
      recordAudit(
        activeOrgId,
        "Resource Booking",
        `Sent counter-offer ($${payload.counterRateUsd}/day: ${payload.counterOfferTerms}) on booking ${payload.requestId}`,
        payload.requestId
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 3. Approve / Check Out / Return Equipment
    if (action === "update_resource_request") {
      const resources = getCollection<Resource[]>("resources", INITIAL_RESOURCES);
      const requests = getCollection<ResourceRequest[]>(
        "resource_requests",
        INITIAL_RESOURCE_REQUESTS
      );
      const targetReq = requests.find((r) => r.id === payload.requestId);
      if (!targetReq) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const nextStatus = payload.nextStatus as ResourceRequest["status"];
      const updatedReqs = requests.map((r) =>
        r.id === payload.requestId
          ? {
              ...r,
              status: nextStatus,
              serialNumberVerified:
                payload.serialNumberVerified ?? r.serialNumberVerified ?? true,
              batteryAndMediaChecked:
                payload.batteryAndMediaChecked ?? r.batteryAndMediaChecked ?? true,
              conditionOnCheckout:
                nextStatus === "Approved" || nextStatus === "Checked Out"
                  ? payload.conditionNote ||
                    "Serial verified, lens/sensor clean, batteries 100%, dual media cards formatted"
                  : r.conditionOnCheckout,
              conditionOnReturn:
                nextStatus === "Returned"
                  ? payload.conditionNote ||
                    "Returned in Excellent condition; inspected & cleared by owner tech"
                  : r.conditionOnReturn,
            }
          : r
      );

      const updatedResources = resources.map((res) => {
        if (res.id !== targetReq.resourceId) return res;
        return {
          ...res,
          status:
            nextStatus === "Returned"
              ? ("Available" as const)
              : nextStatus === "Approved" || nextStatus === "Checked Out"
              ? ("Booked" as const)
              : ("Requested" as const),
        };
      });

      setCollection("resource_requests", updatedReqs);
      setCollection("resources", updatedResources);
      if (nextStatus === "Approved" || nextStatus === "Returned") {
        recordLedgerTransaction({
          fromOrgId: targetReq.requesterOrgId,
          toOrgId: targetReq.ownerOrgId,
          category: "inDrive Gear Escrow",
          description: `${nextStatus === "Approved" ? "Escrow locked" : "Escrow released (95% lender / 5% platform)"} for booking ${targetReq.id}`,
          grossAmountUsd: Number(targetReq.counterRateUsd ?? targetReq.offeredRateUsd ?? 35),
          paymentRail: "USD Escrow (Paynow / EcoCash)",
          referenceId: targetReq.id,
        });
      }
      recordAudit(
        activeOrgId,
        "Resource Booking",
        `Updated booking ${targetReq.id} (PIN ${targetReq.handoverPin}) to '${nextStatus}'`,
        targetReq.resourceId
      );

      return NextResponse.json(getFullWorkspaceState());
    }

    // 4. Create inDrive-Style Field Dispatch Broadcast
    if (action === "create_dispatch_broadcast") {
      const broadcasts = getCollection<DispatchBroadcast[]>(
        "dispatch_broadcasts",
        INITIAL_DISPATCH_BROADCASTS
      );

      const cityCoords: Record<string, { lat: number; lng: number }> = {
        Bulawayo: { lat: -20.1515, lng: 28.5835 },
        Harare: { lat: -17.8265, lng: 31.0365 },
        Mutare: { lat: -18.9715, lng: 32.6715 },
      };

      const newBroadcast: DispatchBroadcast = {
        id: `dsp-${Date.now()}`,
        requesterOrgId: activeOrgId,
        investigationId: "inv-umzingwane",
        title: payload.title,
        needType: payload.needType || "Equipment + Field Operator",
        category: payload.category || "Camera & Optics",
        city: payload.city || "Bulawayo",
        coordinates: cityCoords[payload.city] || cityCoords.Bulawayo,
        radiusKm: Number(payload.radiusKm || 30),
        neededWindow: payload.neededWindow,
        offeredRateUsd: Number(payload.offeredRateUsd || 0),
        offeredTerms: payload.offeredTerms,
        urgency: payload.urgency || "Urgent (Within 24h)",
        status: "Open for Bids",
        createdAt: nowStamp(),
        bids: [],
      };

      setCollection("dispatch_broadcasts", [newBroadcast, ...broadcasts]);
      recordAudit(
        activeOrgId,
        "inDrive Dispatch",
        `Broadcast field need '${newBroadcast.title}' in ${newBroadcast.city} ($${newBroadcast.offeredRateUsd}/day offer)`,
        newBroadcast.id
      );

      return NextResponse.json(getFullWorkspaceState());
    }

    // 5. Submit Bid / Counter-Offer on a Field Dispatch Broadcast
    if (action === "submit_dispatch_bid") {
      const broadcasts = getCollection<DispatchBroadcast[]>(
        "dispatch_broadcasts",
        INITIAL_DISPATCH_BROADCASTS
      );

      const newBid: DispatchBid = {
        id: `bid-${Date.now()}`,
        broadcastId: payload.broadcastId,
        bidderOrgId: activeOrgId,
        bidderName: `${ACTOR_BY_ORG[activeOrgId] || "Field Specialist"} (${activeOrgId})`,
        resourceTitle: payload.resourceTitle,
        proposedRateUsd: Number(payload.proposedRateUsd || 0),
        counterTerms: payload.counterTerms,
        etaNote: payload.etaNote || "2.1 km away • Ready for immediate dispatch",
        distanceKm: Number(payload.distanceKm || 2.1),
        status: "Pending",
        createdAt: nowStamp(),
      };

      const updated = broadcasts.map((b) =>
        b.id === payload.broadcastId
          ? {
              ...b,
              status: "Counter-Offers Active" as const,
              bids: [newBid, ...b.bids],
            }
          : b
      );

      setCollection("dispatch_broadcasts", updated);
      recordAudit(
        activeOrgId,
        "inDrive Dispatch",
        `Submitted bid ($${newBid.proposedRateUsd}/day: '${newBid.resourceTitle}') on broadcast ${payload.broadcastId}`,
        payload.broadcastId
      );

      return NextResponse.json(getFullWorkspaceState());
    }

    // 6. Accept Bid on Field Dispatch Broadcast
    if (action === "accept_dispatch_bid") {
      const broadcasts = getCollection<DispatchBroadcast[]>(
        "dispatch_broadcasts",
        INITIAL_DISPATCH_BROADCASTS
      );
      const pin = `CN-${Math.floor(1000 + Math.random() * 9000)}`;

      const updated = broadcasts.map((b) => {
        if (b.id !== payload.broadcastId) return b;
        return {
          ...b,
          status: "Matched & Dispatched" as const,
          acceptedBidId: payload.bidId,
          handoverPin: pin,
          bids: b.bids.map((bid) => ({
            ...bid,
            status:
              bid.id === payload.bidId
                ? ("Accepted" as const)
                : ("Declined" as const),
          })),
        };
      });

      setCollection("dispatch_broadcasts", updated);
      const matchedBroadcast = broadcasts.find((b) => b.id === payload.broadcastId);
      const matchedBid = matchedBroadcast?.bids.find((b) => b.id === payload.bidId);
      recordLedgerTransaction({
        fromOrgId: activeOrgId,
        toOrgId: matchedBid?.bidderOrgId || "org-cite",
        category: "inDrive Field Dispatch",
        description: `inDrive Dispatch settled: '${matchedBid?.resourceTitle || "Field Kit"}' (PIN ${pin})`,
        grossAmountUsd: Number(matchedBid?.proposedRateUsd ?? 55),
        paymentRail: "USD Escrow (EcoCash / Paynow)",
        referenceId: payload.broadcastId,
      });
      recordAudit(
        activeOrgId,
        "inDrive Dispatch",
        `Accepted dispatch bid ${payload.bidId} on broadcast ${payload.broadcastId} (Generated Handover PIN: ${pin})`,
        payload.broadcastId
      );

      return NextResponse.json(getFullWorkspaceState());
    }

    // 7. Invite Specialist Collaboration
    if (action === "create_collaboration") {
      const collabs = getCollection<CollaborationRequest[]>(
        "collaborations",
        INITIAL_COLLABORATIONS
      );
      const newCollab: CollaborationRequest = {
        id: `col-${Date.now()}`,
        expertId: payload.expertId,
        fromOrgId: activeOrgId,
        toOrgId: payload.toOrgId,
        investigationId: "inv-umzingwane",
        roleRequested: payload.roleRequested,
        scopeNote: payload.scopeNote,
        status: "Accepted",
        createdAt: nowStamp(),
      };
      setCollection("collaborations", [newCollab, ...collabs]);
      recordAudit(
        activeOrgId,
        "Investigation ACL",
        `Added specialist (${payload.expertName}) to PROJECT UMZINGWANE`,
        "inv-umzingwane"
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 8. Kanban Task Mutations (Drag-and-drop move, signoff, comments, right-of-reply)
    if (action === "move_kanban_task") {
      const tasks = getCollection<KanbanTask[]>(
        "kanban_tasks",
        INITIAL_KANBAN_TASKS
      );
      const updated = tasks.map((t) =>
        t.id === payload.taskId ? { ...t, column: payload.newColumn } : t
      );
      setCollection("kanban_tasks", updated);
      recordAudit(
        activeOrgId,
        "Human Verification",
        `Moved task ${payload.taskId} to stage '${payload.newColumn}'`,
        "inv-umzingwane"
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    if (action === "signoff_kanban_task") {
      const tasks = getCollection<KanbanTask[]>(
        "kanban_tasks",
        INITIAL_KANBAN_TASKS
      );
      const signer = `${ACTOR_BY_ORG[activeOrgId] || "Editor"} (${activeOrgId})`;
      const updated = tasks.map((t) =>
        t.id === payload.taskId ? { ...t, signedOffBy: signer } : t
      );
      setCollection("kanban_tasks", updated);
      recordAudit(
        activeOrgId,
        "Human Verification",
        `Signed off primary source verification on task ${payload.taskId}`,
        "inv-umzingwane"
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    if (action === "add_kanban_task") {
      const tasks = getCollection<KanbanTask[]>(
        "kanban_tasks",
        INITIAL_KANBAN_TASKS
      );
      const created: KanbanTask = {
        ...payload.task,
        id: `task-${Date.now()}`,
        comments: [],
      };
      setCollection("kanban_tasks", [created, ...tasks]);
      recordAudit(
        activeOrgId,
        "Investigation ACL",
        `Created investigation task '${created.title}'`,
        created.investigationId
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    if (action === "add_task_comment") {
      const tasks = getCollection<KanbanTask[]>(
        "kanban_tasks",
        INITIAL_KANBAN_TASKS
      );
      const newComment = {
        id: `cmt-${Date.now()}`,
        authorName: ACTOR_BY_ORG[activeOrgId] || "Journalist",
        authorOrgId: activeOrgId,
        text: payload.text,
        createdAt: nowStamp(),
      };
      const updated = tasks.map((t) =>
        t.id === payload.taskId
          ? {
              ...t,
              rightOfReplyStatus:
                payload.rightOfReplyStatus ?? t.rightOfReplyStatus,
              evidenceRef: payload.evidenceRef ?? t.evidenceRef,
              comments: [...(t.comments || []), newComment],
            }
          : t
      );
      setCollection("kanban_tasks", updated);
      recordAudit(
        activeOrgId,
        "Human Verification",
        `Logged verification note on task ${payload.taskId}: "${payload.text.slice(0, 45)}..."`,
        payload.taskId
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 9. Collaborative Story Draft & Pre-Publication Review Gate (GitHub PR Model)
    if (action === "save_investigation_draft") {
      const drafts = getCollection<InvestigationDraft[]>(
        "investigation_drafts",
        INITIAL_INVESTIGATION_DRAFTS
      );
      const updated = drafts.map((d) =>
        d.investigationId === payload.investigationId
          ? {
              ...d,
              headline: payload.headline ?? d.headline,
              subheadline: payload.subheadline ?? d.subheadline,
              bodyMarkdown: payload.bodyMarkdown ?? d.bodyMarkdown,
              attributionText: payload.attributionText ?? d.attributionText,
              licenseType: payload.licenseType ?? d.licenseType,
              lastUpdatedAt: nowStamp(),
            }
          : d
      );
      setCollection("investigation_drafts", updated);
      recordAudit(
        activeOrgId,
        "Evidence Commit",
        `Saved collaborative story draft changes in '${payload.investigationId}'`,
        payload.investigationId
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    if (action === "toggle_draft_approval") {
      const drafts = getCollection<InvestigationDraft[]>(
        "investigation_drafts",
        INITIAL_INVESTIGATION_DRAFTS
      );
      const updated = drafts.map((d) => {
        if (d.investigationId !== payload.investigationId) return d;
        return {
          ...d,
          lastUpdatedAt: nowStamp(),
          approvals: d.approvals.map((app) =>
            app.role === payload.role
              ? {
                  ...app,
                  approved: !app.approved,
                  approvedAt: !app.approved ? nowStamp() : undefined,
                  note: payload.note || app.note,
                }
              : app
          ),
        };
      });
      setCollection("investigation_drafts", updated);
      recordAudit(
        activeOrgId,
        "Human Verification",
        `Updated Pre-Publication Review Gate '${payload.role}' on ${payload.investigationId}`,
        payload.investigationId
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    if (action === "publish_draft_to_exchange") {
      const drafts = getCollection<InvestigationDraft[]>(
        "investigation_drafts",
        INITIAL_INVESTIGATION_DRAFTS
      );
      const stories = getCollection<StoryPackage[]>("stories", INITIAL_STORIES);
      const draft = drafts.find(
        (d) => d.investigationId === payload.investigationId
      );
      if (!draft) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      }

      const allApproved = draft.approvals.every((a) => a.approved);
      if (!allApproved) {
        return NextResponse.json(
          {
            error:
              "PUBLICATION BLOCKED: All 3 Pre-Publication Review Gates (Lead Editor, Partner Data Desk, Pre-Publication Legal) must be signed off before publishing to the News Exchange.",
          },
          { status: 400 }
        );
      }

      const words = draft.bodyMarkdown.trim().split(/\s+/).length;
      const newStory: StoryPackage = {
        id: `story-${Date.now()}`,
        title: draft.headline,
        subtitle: draft.subheadline,
        originOrgId: activeOrgId,
        coAuthorOrgIds: ["org-hre", "org-cite"].filter(
          (id) => id !== activeOrgId
        ),
        investigationId: draft.investigationId,
        publishedAt: nowStamp(),
        embargoLift: "Immediate Release (3/3 Review Gates Signed Off)",
        licenseType: draft.licenseType,
        attributionRequirement: draft.attributionText,
        mediaIncluded: draft.mediaAssets,
        wordCount: words,
        humanVerifiedBy: draft.approvals
          .map((a) => `${a.reviewerName} (${a.role})`)
          .join(", "),
        excerpt:
          draft.bodyMarkdown.replace(/#+/g, "").slice(0, 320).trim() + "...",
        bodyMarkdown: draft.bodyMarkdown,
        republishCount: 1,
      };

      setCollection("stories", [newStory, ...stories]);
      recordAudit(
        activeOrgId,
        "Story Syndication",
        `Merged & published verified investigation '${newStory.title}' to News Exchange`,
        newStory.id
      );

      return NextResponse.json(getFullWorkspaceState());
    }

    // 10. Document Upload & Audit Logging
    if (action === "upload_document") {
      const docs = getCollection<DocumentRecord[]>(
        "documents",
        INITIAL_DOCUMENTS
      );
      setCollection("documents", [payload.document, ...docs]);
      recordAudit(
        activeOrgId,
        "Evidence Commit",
        `Indexed document '${payload.document.title}' into SQLite repository`,
        payload.document.id
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 11. Request Story Syndication
    if (action === "request_syndication") {
      const stories = getCollection<StoryPackage[]>("stories", INITIAL_STORIES);
      const syndications = getCollection<SyndicationRequest[]>(
        "syndication_requests",
        INITIAL_SYNDICATION_REQUESTS
      );
      const newSyn: SyndicationRequest = {
        id: `syn-${Date.now()}`,
        storyId: payload.storyId,
        requestingOrgId: activeOrgId,
        originOrgId: payload.originOrgId,
        status: "Approved",
        plannedPublishDate: "2026-11-05 06:00 CAT",
        agreedAttribution: payload.agreedAttribution,
      };
      setCollection("syndication_requests", [newSyn, ...syndications]);
      setCollection(
        "stories",
        stories.map((s) =>
          s.id === payload.storyId
            ? { ...s, republishCount: s.republishCount + 1 }
            : s
        )
      );
      recordLedgerTransaction({
        fromOrgId: activeOrgId,
        toOrgId: payload.originOrgId,
        category: "Story Syndication Split",
        description: `Republication license & co-investigation revenue split (60% Lead / 35% Partner / 5% Platform)`,
        grossAmountUsd: 80,
        creditsMoved: 25,
        paymentRail: "USD Wire / Network Credits Split",
        referenceId: payload.storyId,
      });
      recordAudit(
        activeOrgId,
        "Story Syndication",
        `Granted republication license on story ${payload.storyId} with attribution lock`,
        payload.storyId
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 12. Generic Audit Log Entry
    if (action === "log_audit") {
      recordAudit(
        activeOrgId,
        payload.category || "AI Query",
        payload.actionText,
        payload.resourceTarget
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mutate SQLite state" },
      { status: 500 }
    );
  }
}
