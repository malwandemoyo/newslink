import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
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
  Resource,
  ResourceRequest,
  DispatchBroadcast,
  CollaborationRequest,
  InvestigationDraft,
  KanbanTask,
  DocumentRecord,
  StoryPackage,
  SyndicationRequest,
  AuditLogEntry,
} from "@/types/newsroom";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "connected_newsroom.sqlite");

let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS kv_collections (
      collection_key TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_org_id TEXT NOT NULL,
      category TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_target TEXT NOT NULL
    );
  `);

  const checkStmt = db.prepare(
    "SELECT COUNT(*) as cnt FROM kv_collections WHERE collection_key = 'investigation_drafts'"
  );
  const row = checkStmt.get() as { cnt: number } | undefined;

  if (!row || row.cnt === 0) {
    seedDatabaseInternal(db);
  }

  dbInstance = db;
  return db;
}

function seedDatabaseInternal(db: DatabaseSync) {
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO kv_collections (collection_key, payload_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(collection_key) DO UPDATE SET
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at
  `);

  upsert.run("resources", JSON.stringify(INITIAL_RESOURCES), now);
  upsert.run("resource_requests", JSON.stringify(INITIAL_RESOURCE_REQUESTS), now);
  upsert.run("dispatch_broadcasts", JSON.stringify(INITIAL_DISPATCH_BROADCASTS), now);
  upsert.run("collaborations", JSON.stringify(INITIAL_COLLABORATIONS), now);
  upsert.run("kanban_tasks", JSON.stringify(INITIAL_KANBAN_TASKS), now);
  upsert.run("investigation_drafts", JSON.stringify(INITIAL_INVESTIGATION_DRAFTS), now);
  upsert.run("documents", JSON.stringify(INITIAL_DOCUMENTS), now);
  upsert.run("stories", JSON.stringify(INITIAL_STORIES), now);
  upsert.run("syndication_requests", JSON.stringify(INITIAL_SYNDICATION_REQUESTS), now);

  db.exec("DELETE FROM audit_logs;");
  const insertLog = db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actor_name, actor_org_id, category, action, resource_target)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const log of INITIAL_AUDIT_LOGS) {
    insertLog.run(
      log.id,
      log.timestamp,
      log.actorName,
      log.actorOrgId,
      log.category,
      log.action,
      log.resourceTarget
    );
  }
}

export function getCollection<T>(key: string, fallback: T): T {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT payload_json FROM kv_collections WHERE collection_key = ?"
  );
  const row = stmt.get(key) as { payload_json: string } | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.payload_json) as T;
  } catch {
    return fallback;
  }
}

export function setCollection<T>(key: string, data: T): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO kv_collections (collection_key, payload_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(collection_key) DO UPDATE SET
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at
  `);
  stmt.run(key, JSON.stringify(data), new Date().toISOString());
}

export function insertAuditLog(entry: AuditLogEntry): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actor_name, actor_org_id, category, action, resource_target)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    entry.id,
    entry.timestamp,
    entry.actorName,
    entry.actorOrgId,
    entry.category,
    entry.action,
    entry.resourceTarget
  );
}

export function getAuditLogs(): AuditLogEntry[] {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT id, timestamp, actor_name as actorName, actor_org_id as actorOrgId, category, action, resource_target as resourceTarget FROM audit_logs ORDER BY rowid DESC LIMIT 100"
  );
  return stmt.all() as unknown as AuditLogEntry[];
}

export function getFullWorkspaceState() {
  return {
    organisations: INITIAL_ORGANISATIONS,
    experts: INITIAL_EXPERTS,
    investigations: INITIAL_INVESTIGATIONS,
    resources: getCollection<Resource[]>("resources", INITIAL_RESOURCES),
    resourceRequests: getCollection<ResourceRequest[]>(
      "resource_requests",
      INITIAL_RESOURCE_REQUESTS
    ),
    dispatchBroadcasts: getCollection<DispatchBroadcast[]>(
      "dispatch_broadcasts",
      INITIAL_DISPATCH_BROADCASTS
    ),
    collaborations: getCollection<CollaborationRequest[]>(
      "collaborations",
      INITIAL_COLLABORATIONS
    ),
    kanbanTasks: getCollection<KanbanTask[]>(
      "kanban_tasks",
      INITIAL_KANBAN_TASKS
    ),
    investigationDrafts: getCollection<InvestigationDraft[]>(
      "investigation_drafts",
      INITIAL_INVESTIGATION_DRAFTS
    ),
    documents: getCollection<DocumentRecord[]>("documents", INITIAL_DOCUMENTS),
    stories: getCollection<StoryPackage[]>("stories", INITIAL_STORIES),
    syndicationRequests: getCollection<SyndicationRequest[]>(
      "syndication_requests",
      INITIAL_SYNDICATION_REQUESTS
    ),
    auditLogs: getAuditLogs(),
  };
}

export function resetSqliteDatabase() {
  const db = getDb();
  seedDatabaseInternal(db);
  return getFullWorkspaceState();
}
