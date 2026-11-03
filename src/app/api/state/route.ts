import { NextRequest, NextResponse } from "next/server";
import {
  getFullWorkspaceState,
  getCollection,
  setCollection,
  insertAuditLog,
  resetSqliteDatabase,
} from "@/lib/db";
import {
  INITIAL_RESOURCES,
  INITIAL_RESOURCE_REQUESTS,
  INITIAL_DISPATCH_BROADCASTS,
  INITIAL_COLLABORATIONS,
  INITIAL_KANBAN_TASKS,
  INITIAL_DOCUMENTS,
  INITIAL_STORIES,
  INITIAL_SYNDICATION_REQUESTS,
} from "@/data/seed";
import {
  Resource,
  ResourceRequest,
  DispatchBroadcast,
  DispatchBid,
  CollaborationRequest,
  KanbanTask,
  DocumentRecord,
  StoryPackage,
  SyndicationRequest,
  AuditLogEntry,
} from "@/types/newsroom";

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

    // 3. Approve / Check Out (with PIN & Serial Verification) / Return Equipment
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
      recordAudit(
        activeOrgId,
        "Resource Booking",
        `Updated booking ${targetReq.id} (PIN ${targetReq.handoverPin}) to '${nextStatus}'`,
        targetReq.resourceId
      );

      return NextResponse.json(getFullWorkspaceState());
    }

    // 4. Create inDrive-Style Field Dispatch Broadcast ("Post a Need")
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

    // 6. Accept Bid on Field Dispatch Broadcast (Locks Match & Generates Handover PIN)
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

    // 8. Kanban Task Mutations
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

    // 9. Document Upload & Audit Logging
    if (action === "upload_document") {
      const docs = getCollection<DocumentRecord[]>(
        "documents",
        INITIAL_DOCUMENTS
      );
      setCollection("documents", [payload.document, ...docs]);
      recordAudit(
        activeOrgId,
        "Investigation ACL",
        `Indexed document '${payload.document.title}' into SQLite/Qdrant repository`,
        payload.document.id
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 10. Request Story Syndication
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
      recordAudit(
        activeOrgId,
        "Story Syndication",
        `Granted republication license on story ${payload.storyId} with attribution lock`,
        payload.storyId
      );
      return NextResponse.json(getFullWorkspaceState());
    }

    // 11. Generic Audit Log Entry
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
