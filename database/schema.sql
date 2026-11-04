-- Connected Newsroom — Relational SQLite Schema (database/schema.sql)
-- Powers:
-- 1. inDrive for Journalism (Resource Exchange, Fare Bidding, AI Matchmaking & Escrow Ledger)
-- 2. GitHub for Journalism (Investigation Repos, SHA Evidence Commits, AI PR Diff Review)
-- 3. Kanban for Journalism (5-Stage Cross-Newsroom Verification Board + AI Task Planner)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. Media Organisations & Escrow Wallets
CREATE TABLE IF NOT EXISTS organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  org_type TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  wallet_balance_usd REAL NOT NULL DEFAULT 250.0,
  network_credits INTEGER NOT NULL DEFAULT 100,
  verified INTEGER NOT NULL DEFAULT 1,
  beats_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Journalists & Specialists Directory
CREATE TABLE IF NOT EXISTS journalists (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  city TEXT NOT NULL,
  daily_rate_usd REAL NOT NULL DEFAULT 50.0,
  availability TEXT NOT NULL DEFAULT 'Available for Dispatch',
  verified INTEGER NOT NULL DEFAULT 1,
  beats_json TEXT NOT NULL DEFAULT '[]',
  skills_json TEXT NOT NULL DEFAULT '[]',
  languages_json TEXT NOT NULL DEFAULT '[]',
  bio TEXT NOT NULL DEFAULT ''
);

-- 3. inDrive Equipment & Facility Listings
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  owner_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  suggested_rate_usd REAL NOT NULL DEFAULT 25.0,
  credit_cost INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'Available',
  serial_tag TEXT NOT NULL,
  condition_summary TEXT NOT NULL,
  includes_operator INTEGER NOT NULL DEFAULT 0,
  specs_json TEXT NOT NULL DEFAULT '[]',
  ai_pricing_note TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. inDrive Urgent Field Broadcasts & Peer-to-Peer Fare Bids
CREATE TABLE IF NOT EXISTS dispatch_broadcasts (
  id TEXT PRIMARY KEY,
  requester_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  investigation_id TEXT,
  title TEXT NOT NULL,
  need_type TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_km INTEGER NOT NULL DEFAULT 25,
  needed_window TEXT NOT NULL,
  offered_rate_usd REAL NOT NULL,
  ai_suggested_rate_usd REAL DEFAULT NULL,
  ai_match_reason TEXT DEFAULT NULL,
  offered_terms TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'Urgent (Within 24h)',
  status TEXT NOT NULL DEFAULT 'Broadcasting',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dispatch_bids (
  id TEXT PRIMARY KEY,
  broadcast_id TEXT NOT NULL REFERENCES dispatch_broadcasts(id) ON DELETE CASCADE,
  bidder_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  bidder_name TEXT NOT NULL,
  resource_title TEXT NOT NULL,
  distance_km REAL NOT NULL DEFAULT 2.0,
  proposed_rate_usd REAL NOT NULL,
  counter_terms TEXT NOT NULL,
  eta_note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Direct Equipment Booking Requests & Escrow Status
CREATE TABLE IF NOT EXISTS resource_requests (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  requester_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  owner_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  requested_dates TEXT NOT NULL,
  offered_rate_usd REAL NOT NULL,
  counter_rate_usd REAL DEFAULT NULL,
  settlement_mode TEXT NOT NULL DEFAULT 'USD Escrow',
  proposed_terms TEXT NOT NULL,
  counter_offer_terms TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Owner Approval',
  handover_pin TEXT NOT NULL DEFAULT '4829',
  escrow_status TEXT NOT NULL DEFAULT 'Held in Escrow',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. GitHub-Style Investigation Repositories & Partner Access Control
CREATE TABLE IF NOT EXISTS investigations (
  id TEXT PRIMARY KEY,
  code_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  lead_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Active Verification',
  security_level TEXT NOT NULL DEFAULT 'Multi-Newsroom Confidential (End-to-End ACL)',
  embargo_until TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS investigation_partners (
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Partner Newsroom',
  PRIMARY KEY (investigation_id, org_id)
);

-- 7. GitHub-Style Evidence Commits (Documents) & Indexed Passages
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  source_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  document_type TEXT NOT NULL,
  publisher TEXT NOT NULL DEFAULT 'Official Record',
  publication_date TEXT NOT NULL DEFAULT '2026-10-15',
  source_url TEXT NOT NULL DEFAULT 'local://repository/evidence',
  page_count INTEGER NOT NULL DEFAULT 1,
  ai_consent_status TEXT NOT NULL DEFAULT 'Approved for Cloud & Local AI',
  summary TEXT NOT NULL,
  entities_json TEXT NOT NULL DEFAULT '{}',
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_passages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  section_title TEXT NOT NULL,
  quote TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'Documented Evidence',
  entities_json TEXT NOT NULL DEFAULT '[]',
  dates_json TEXT NOT NULL DEFAULT '[]'
);

-- 8. 5-Stage Verification Kanban Board Tasks
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id TEXT PRIMARY KEY,
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  column_id TEXT NOT NULL DEFAULT 'leads',
  assigned_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  assignee_name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'High',
  evidence_ref TEXT DEFAULT NULL,
  signed_off_by TEXT DEFAULT NULL,
  right_of_reply_status TEXT NOT NULL DEFAULT 'Pending Contact',
  ai_generated INTEGER NOT NULL DEFAULT 0,
  comments_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. GitHub Pull-Request Style Story Drafts & 3-Gate Pre-Publication Reviews
CREATE TABLE IF NOT EXISTS story_drafts (
  id TEXT PRIMARY KEY,
  investigation_id TEXT NOT NULL UNIQUE REFERENCES investigations(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL DEFAULT 'main-release-candidate',
  headline TEXT NOT NULL,
  subheadline TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  license_type TEXT NOT NULL DEFAULT 'CC BY-NC-ND 4.0 (Network Attribution)',
  attribution_text TEXT NOT NULL,
  ai_pr_review_json TEXT DEFAULT NULL,
  approvals_json TEXT NOT NULL DEFAULT '[]',
  last_edited_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. News Exchange Syndicated Story Packages
CREATE TABLE IF NOT EXISTS story_packages (
  id TEXT PRIMARY KEY,
  investigation_id TEXT,
  origin_org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_markdown TEXT DEFAULT NULL,
  byline TEXT NOT NULL,
  published_status TEXT NOT NULL DEFAULT 'Ready for Immediate Republication',
  embargo_timestamp TEXT DEFAULT NULL,
  license_type TEXT NOT NULL,
  commercial_fee_usd REAL NOT NULL DEFAULT 95.0,
  attribution_template TEXT NOT NULL,
  fact_check_score INTEGER NOT NULL DEFAULT 98,
  media_assets_json TEXT NOT NULL DEFAULT '[]',
  republished_by_org_ids_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. Money & Network Credits Movement Ledger (Escrow, Gear Rentals, Story Syndication Splits)
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id TEXT PRIMARY KEY,
  from_org_id TEXT REFERENCES organisations(id),
  to_org_id TEXT REFERENCES organisations(id),
  category TEXT NOT NULL, -- 'inDrive Gear Escrow', 'Field Crew Dispatch', 'Story Syndication Split', 'Network Credit Barter'
  description TEXT NOT NULL,
  gross_amount_usd REAL NOT NULL DEFAULT 0.0,
  platform_fee_usd REAL NOT NULL DEFAULT 0.0,
  net_payout_usd REAL NOT NULL DEFAULT 0.0,
  credits_moved INTEGER NOT NULL DEFAULT 0,
  payment_rail TEXT NOT NULL DEFAULT 'USD Escrow (Paynow / EcoCash)',
  status TEXT NOT NULL DEFAULT 'Settled',
  reference_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. Immutable Security & Activity Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_org_id TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_target TEXT NOT NULL
);
