# Product Roadmap — NewsLink

NewsLink is designed to evolve from a regional hackathon MVP into sustainable public-interest media infrastructure across Southern Africa.

---

## Phase 1: Hackathon MVP (Completed — Current Release)
- **Unified Collaboration Portal:** Next.js 15 + Express + 12-table SQLite relational database (`data/connected_newsroom.sqlite`) with Docker Compose orchestration.
- **inDrive-Style Resource Exchange:** 4-layer interactive Leaflet map, urgent field dispatch broadcasts, counter-offer bidding, and 4-digit PIN handover.
- **Dual-Rail Settlement Engine:** USD Escrow (`95%` Lender / `5%` Platform fee) alongside `0%`-fee Reciprocal Network Credits.
- **GitHub + Kanban Investigation Workspace:** Private multi-newsroom repositories, 5-stage Verification Kanban board, and 3-Gate Editorial & Legal Sign-Off.
- **Google Gemini (`gemini-3.8-flash`) AI Suite:** Grounded document RAG, `tesseract.js` OCR, *Before vs. After* headline verification, audio interview transcription with isiNdebele/ChiShona translation, and equipment/specialist matchmaking.

---

## Phase 2: Production Hardening & Payment Gateway Integration (Months 1–3)
- **PostgreSQL 16 + PostGIS + pgvector Migration:** Replace single-writer SQLite (`SQLITE_BUSY` bottleneck under heavy concurrent writes) with pooled PostgreSQL + `pgvector` for sub-10ms hybrid semantic + keyword search across 50,000+ pages of gazettes and procurement filings.
- **Live Paynow & EcoCash Merchant Escrow API:** Connect `ledger_transactions` directly to Zimbabwean mobile-money and ZiG/USD bank rails for automated escrow lock and payout on return.
- **Background BullMQ + Redis Ingestion Workers:** Offload multi-hundred-page PDF OCR and long-form audio transcription to asynchronous worker queues.

---

## Phase 3: Cross-Border SADC Investigative Federation (Months 4–9)
- **WhatsApp Cloud API Tipline & Field Bot:** Allow community reporters in low-bandwidth districts to submit geotagged voice notes, photos, and equipment requests via WhatsApp directly into an investigation's Kanban `Source Leads` column.
- **Automated Public Gazette & Procurement Scraper:** Nightly ingestion of Government Gazettes, ZINWA/EMA notices, and company registry bulletins with automated entity alerts when a watched contractor or director appears.
- **Cryptographic Media Provenance (C2PA):** Sign field drone imagery and audio recordings at capture time to verify authenticity for courtroom and regulatory evidence.
