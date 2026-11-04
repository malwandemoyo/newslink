# API Documentation — Connected Newsroom

Connected Newsroom exposes RESTful JSON endpoints across the **Next.js Application Server (`http://localhost:3000`)** and the **Express + SQLite Microservice (`http://localhost:4000`)**. All API keys are loaded strictly from `.env`.

---

## 1. Workspace State & Workflow Mutations (`/api/state`)

### `GET /api/state`
Returns the complete SQLite-persisted workspace state (`organisations`, `resources`, `resourceRequests`, `broadcasts`, `experts`, `collaborations`, `investigations`, `tasks`, `drafts`, `documents`, `stories`, `syndications`, `ledgerTransactions`, `auditLogs`).

### `POST /api/state`
Executes an atomic state mutation inside SQLite and appends an immutable entry to `audit_logs` (and `ledger_transactions` when money or credits move).

**Request Body Structure:**
```json
{
  "action": "register_organisation | create_resource | request_resource | counter_offer_resource | update_resource_status | create_investigation | ai_generate_kanban_tasks | move_task | signoff_task | approve_draft_gate | publish_story | request_syndication",
  "activeOrgId": "org-byo",
  "payload": {}
}
```

---

## 2. Grounded AI Research & Headline Verification (`/api/ai/research`)

### `POST /api/ai/research`
Executes permission-aware Retrieval-Augmented Generation (RAG) and Misleading Headline vs. Official Audit verification using `gemini-3.8-flash`.

**Request Body:**
```json
{
  "query": "Fact-check this viral headline against our primary documents: 'City Official Steals $2.4 Million Meant for Gwanda Solar Pumps!'",
  "investigationId": "inv-umzingwane",
  "requestingOrgId": "org-byo",
  "allowedDocumentIds": ["doc-zim-ag-2026", "doc-mining-lease-44"]
}
```

**Response (`200 OK`):**
```json
{
  "answer": "VERDICT: MISLEADING HEADLINE / UNSUBSTANTIATED THEFT CLAIM...",
  "citations": [
    {
      "documentId": "doc-zim-ag-2026",
      "documentTitle": "Auditor-General Special Water Infrastructure Annex (2025/26)",
      "pageNumber": 47,
      "sectionTitle": "Section 4.2 — Unreconciled Borehole & Solar Disbursement Variance",
      "exactQuote": "Out of US$2,400,000 disbursed under Contract ZINWA-MAT-2025-09...",
      "classification": "Documented Evidence"
    }
  ],
  "verificationWarning": "Human Verification Required: Every cited passage must be inspected in the Source Passage Drawer...",
  "executionMode": "Google Gemini API (gemini-3.8-flash — Grounded Verification)"
}
```
- **ACL Enforcement (`403 Forbidden`):** If `requestingOrgId` is not the `leadOrgId` or an authorized `partnerOrgId` on the target investigation, the endpoint logs a `Security ACL` violation and returns `HTTP 403`.

---

## 3. AI Audio Interview Transcription & Translation (`/api/ai/transcribe`)

### `POST /api/ai/transcribe`
Transcribes uploaded field audio (`.mp3`, `.wav`, `.m4a`) or field interview notes using `gemini-3.8-flash`, producing speaker-diarized timestamps, **isiNdebele / ChiShona to English translation**, and `Documented Evidence` vs. `Unverified Allegation` tags.

**Request Body:**
```json
{
  "investigationId": "inv-umzingwane",
  "activeOrgId": "org-byo",
  "audioTitle": "Gwanda Ward 14 Field Interview — MaNdlovu & District Water Engineer",
  "languageHint": "Mixed isiNdebele, ChiShona & English",
  "fieldNotes": "Optional raw notes or base64 audio payload"
}
```

---

## 4. AI Resource & Collaborator Matchmaker (`/api/ai/recommend`)

### `POST /api/ai/recommend`
Analyzes the active investigation's evidence gaps and uses `gemini-3.8-flash` to recommend available partner equipment (`resources`) and accredited specialists (`experts`).

**Request Body:**
```json
{
  "investigationId": "inv-umzingwane",
  "activeOrgId": "org-byo"
}
```

---

## 5. 10-Organisation Concurrent Load & Stress Benchmark (`/api/telemetry/load-test`)

### `POST /api/telemetry/load-test`
Executes **50 real concurrent operations across 10 simulated media organisations** (20 SQLite writes, 15 cross-org ACL checks, 10 passage searches, and 5 concurrent `gemini-3.8-flash` calls) and returns measured `avgMs`, `p95Ms`, RSS/Heap memory, and bottleneck diagnostics for Hackathon Question 4.

---

## 6. Standalone Express + SQLite Microservice (`http://localhost:4000`)

- `GET /api/health` — Returns SQLite database size, table row counts, and `.env` configuration status (`geminiConfigured`, `mapsConfigured`).
- `GET /api/organisations` & `POST /api/organisations` — Lists or registers media organisations with automatic onboarding wallets.
- `POST /api/ledger/transfer` — Settles USD Escrow (`5%` platform fee) or Reciprocal Network Credits (`0%` fee) across newsrooms.
- `POST /api/indrive/ai-price-gear` — Uses Gemini to suggest peer-to-peer daily equipment rates and handover checklists.
- `POST /api/kanban/ai-generate-tasks` — Generates cross-newsroom Kanban verification tasks.
- `POST /api/github/ai-pr-review` — Runs automated citation and Right-of-Reply checks on investigative story drafts.
