# Functional & Non-Functional Requirements — NewsLink

## 1. Acceptance Criteria Checklist

| ID | Requirement / Acceptance Criterion | Priority | Status | Verification Path |
| :--- | :--- | :---: | :---: | :--- |
| **AC-1** | A newsroom can create and manage its organisation profile and receive an onboarding wallet (`$300 USD + 120 Credits`). | P0 | ✅ Verified | Top bar **`+ Register Newsroom`** modal (`register_organisation`). |
| **AC-2** | A user can list equipment with AI-suggested daily rates and manage its availability on a geographic map. | P0 | ✅ Verified | **Gear & Field Crew → `+ List Equipment`** + **4-Layer Leaflet Map**. |
| **AC-3** | Another newsroom can request equipment, negotiate a counter-offer, receive approval, and complete PIN handover. | P0 | ✅ Verified | **Gear & Field Crew → Booking Lifecycle & PIN Handover**. |
| **AC-4** | A journalist can discover accredited specialists by beat/language or via the Gemini Matchmaker and invite them to collaborate. | P0 | ✅ Verified | **Dashboard Gemini Matchmaker** & **Accredited Specialists Directory**. |
| **AC-5** | Approved collaborators can access their shared investigation workspace, 5-stage Kanban board, and 3-Gate Pre-Publication review. | P1 | ✅ Verified | **Investigations & AI (`Step 1`, `Step 2`, `Step 3`)**. |
| **AC-6** | An authorised user can upload documents (`.pdf`, `.txt`, `.csv`, OCR `.png`/`.jpg`) and field audio recordings and receive AI answers grounded in those files. | P0 | ✅ Verified | **Investigations Step 1A/1B/1C** & **Media Verification (Q1/Q5)**. |
| **AC-7** | AI responses include clickable `[DocTitle, p. X]` references and distinguish *Documented Evidence* from *Unverified Allegations*. | P0 | ✅ Verified | **Media Verification (Q1/Q5)** & `/api/ai/research`. |
| **AC-8** | A newsroom can share a completed story package with attribution and licensing (`CC BY-NC-ND 4.0` or `$120` commercial split). | P1 | ✅ Verified | **News Exchange Wire (`publish_story` & `request_syndication`)**. |
| **AC-9** | Unauthorised organisations receive `HTTP 403 Forbidden` when attempting to query private investigation documents. | P0 | ✅ Verified | **System & Cost (Q4) → Trigger Cross-Org ACL Test**. |
| **AC-10** | System tracks real-time resource usage, cost breakdown, and 10-organisation concurrent load performance. | P0 | ✅ Verified | **System & Cost (Q4) → Run 10-Org Concurrent Load Test**. |
