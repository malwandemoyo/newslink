# Security & Editorial Governance Model — NewsLink

Independent investigative newsrooms handle sensitive public-interest records, whistle-blower leaks, and embargoed drafts. NewsLink enforces defence-in-depth across four layers:

---

## 1. Cross-Organisation Access Control (ACL Isolation)
- Every investigation (`investigations`) is **Private-by-Default** (`Partner-Only Embargo`).
- Access to documents, passages, and AI research queries is strictly restricted to:
  1. The `leadOrgId` that created the investigation, and
  2. Partner newsrooms explicitly added to `partnerOrgIds` (`investigation_partners`).
- **Live Verification (`HTTP 403`):** If an uninvited organisation (e.g., `org-mre` *Manicaland Community Wire*) attempts to query the AI Research Assistant on the `inv-umzingwane` investigation led by `org-byo`, `/api/ai/research` blocks the request with `HTTP 403 Forbidden` before any passage reaches the LLM and records a `Security ACL` alert in `audit_logs`.

---

## 2. Responsible AI & Anti-Defamation Safeguards
- **Strict Primary-Source Grounding:** AI responses only synthesize passages from uploaded repository documents and attach mandatory `[DocTitle, p. X]` citations.
- **Evidence vs. Allegation Classification:** Every indexed passage and interview segment is tagged as either `Documented Evidence` (verified audit tables, lab certificates, signed deeds) or `Unverified Allegation` (uncorroborated witness claims requiring Right-of-Reply).
- **Mandatory 3-Gate Human Sign-Off:** AI cannot publish stories. Before a story draft can be published to the News Exchange Wire, three human gates must be signed:
  1. **Gate 1:** Lead Newsroom Editor (`org-byo`)
  2. **Gate 2:** Partner Verification Editor (`org-hre` / `org-cite`)
  3. **Gate 3:** Legal & Right-of-Reply Counsel (confirming 48-hour Right-of-Reply outreach to named subjects)

---

## 3. Physical Equipment Escrow & 4-Digit PIN Handover
- Equipment bookings require a 4-stage chain of custody (`Requested → Approved → Checked Out → Returned`).
- When a lending newsroom approves a request, the system generates a unique **4-digit Handover PIN** and holds the USD Escrow (`5%` fee) or Reciprocal Network Credits (`0%` fee).
- Funds/credits are only released when the return condition (`Mint` / `Good` / `Needs Service`) is logged and verified.

---

## 4. Environment Secret Isolation & Audit Trail
- All API credentials (`GEMINI_API_KEY`, `MAPS_API_KEY`, `NEXT_PUBLIC_MAPS_API_KEY`) are loaded strictly from git-ignored `.env` files—zero credentials are hardcoded in source files or Docker images.
- Every state change, AI query, document upload, and financial settlement writes an immutable timestamped record to the `audit_logs` and `ledger_transactions` SQLite tables.
