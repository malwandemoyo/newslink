# NewsLink

> **Stronger newsrooms. Better journalism.**
> An open-source, AI-assisted collaboration platform connecting independent media organisations across Zimbabwe and Southern Africa through shared equipment, specialist discovery, collaborative investigations, grounded AI verification, and story syndication.

---

## 1. Core Architecture: "GitHub + Kanban + inDrive for Journalism"

| Module | Mental Model | Key Capabilities |
| :--- | :--- | :--- |
| **1. Resource Exchange** | **inDrive for Journalism** | Peer-to-peer equipment lending & field dispatch broadcasts on an interactive 4-layer **Leaflet Map** (`GeographicMap.tsx`), counter-offer bidding, 4-digit PIN physical handover/return verification, and **Dual-Rail Escrow** (`5%` platform fee on USD Escrow via Paynow/EcoCash; `0%` fee on Reciprocal Network Credits). |
| **2. Expertise Network** | **Accredited Specialist Directory** | Discover investigative reporters, drone operators, forensic accountants, and vernacular translators (*English, isiNdebele, ChiShona, Ndau*) and invite them into private dossiers. |
| **3. Investigation Workspace** | **GitHub + Kanban for Journalism** | Private-by-default multi-newsroom repositories (`org-byo` + `org-cite` + `org-hre`), 5-stage drag-and-drop Verification Kanban board, inline `[Citation: Doc, p. X]` commit tracking, and a mandatory **3-Gate Pre-Publication Editorial & Legal Sign-Off**. |
| **4. AI Newsroom Assistant** | **Google Gemini (`gemini-3.8-flash`)** | 1) Grounded PDF/CSV/TXT & `tesseract.js` OCR document ingestion with page citations; 2) **Misleading Headline vs. Official Audit** verification (*Before vs. After* adding a 2nd document); 3) **Audio Interview Transcription & Vernacular Translation** (`/api/ai/transcribe`); 4) **Resource & Collaborator Matchmaker** (`/api/ai/recommend`); 5) **AI Kanban Task Planner & Pull-Request Citation Reviewer**. |
| **5. News Exchange** | **Syndication Wire** | Distribute signed-off story packages with provenance badges, embargo windows, and commercial (`$120` 60% Lead / 35% Partner / 5% Platform split) or `CC BY-NC-ND 4.0` licensing. |

---

## 2. Project Structure

```text
connected-newsroom/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── state/route.ts               # SQLite state & Dual-Rail ledger mutations
│   │   │   ├── ai/research/route.ts         # Grounded RAG & Before/After headline verification
│   │   │   ├── ai/transcribe/route.ts       # Audio interview transcription & translation
│   │   │   ├── ai/recommend/route.ts        # AI Equipment & Specialist matchmaker
│   │   │   ├── ai/ingest/route.ts           # PDF/TXT/CSV & OCR passage indexing
│   │   │   └── telemetry/load-test/route.ts # 10-Organisation (50-op) concurrent benchmark
│   │   └── page.tsx                         # Unified NewsLink portal
│   ├── components/
│   │   ├── GeographicMap.tsx                # 4-layer Leaflet map (Hubs, Gear, Specialists, Broadcasts)
│   │   ├── MediaVerificationWorkspace.tsx   # ZMC-NUST Q1 & Q5 Headline vs. Audit verifier
│   │   ├── ResourceExchangeView.tsx         # inDrive gear bookings, bids & PIN handover
│   │   ├── InvestigationWorkspaceView.tsx   # GitHub + Kanban + AI Copilot + 3-Gate Sign-Off
│   │   ├── NewsExchangeView.tsx             # Syndication wire & revenue split settlements
│   │   └── SecurityAuditView.tsx            # ACL matrix, 10-Org load test runner & cost tracker
│   ├── lib/db.ts                            # Node 22+/23+ native SQLite persistence layer
│   └── data/seed.ts                         # Realistic Zimbabwean multi-newsroom seed data
├── backend/
│   ├── server.mjs                           # Standalone Express + SQLite + Gemini microservice (:4000)
│   └── Dockerfile                           # Container build for Express backend
├── database/
│   └── schema.sql                           # 12 relational SQLite tables + indexes
├── docs/                                    # Technical documentation pack
│   ├── PROJECT_HANDOVER.md
│   ├── REQUIREMENTS.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DOCUMENTATION.md
│   ├── SECURITY.md
│   └── ROADMAP.md
├── presentation/                            # Pitch deck & live demo script
│   ├── pitch-deck.md
│   └── demo-script.md
├── EVALUATION_ANSWERS.md                    # Complete answers to ZMC-NUST Shortlisting Questions 1–5
├── docker-compose.yml                       # Multi-container orchestration (Frontend + Backend + SQLite Volume)
├── Dockerfile                               # Multi-stage Next.js production container
└── .env.example                             # Environment variable template
```

---

## 3. Installation & Configuration

### Prerequisites
- **Node.js 22.5+ / 23+ / 24+** (uses native `node:sqlite` `DatabaseSync` with zero C++ compilation overhead)
- **Docker & Docker Compose** (optional, for containerised deployment)

### Environment Variables (`.env`)
Copy `.env.example` to `.env` (never hardcode keys in source files):
```bash
cp .env.example .env
```

Configure `.env`:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
MAPS_API_KEY=your_maps_api_key_here
NEXT_PUBLIC_MAPS_API_KEY=your_maps_api_key_here
BACKEND_PORT=4000
BACKEND_URL=http://localhost:4000
```

### Local Development
```bash
npm install

# Start the Express + SQLite + Gemini backend on http://localhost:4000
npm run backend

# In a second terminal, start the Next.js portal on http://localhost:3000
npm run dev
```

### Reproducible Docker Deployment
```bash
docker compose up --build -d
```
- **Next.js Portal:** `http://localhost:3000`
- **Express + SQLite API Health:** `http://localhost:4000/api/health`

---

## 4. The 5 Essential Demo Journeys

1. **Organisation Onboarding:** Click **`+ Register Newsroom`** in the top header to onboard a new independent media house with an automatic `$300 USD` Escrow Wallet + `120 Network Credits`.
2. **Resource Exchange (inDrive for Journalism):** Open **Gear & Field Crew**, list a camera with **Gemini AI Fare Pricing**, request a partner's drone, approve the request, and verify the 4-digit handover PIN.
3. **Expertise Discovery:** Filter accredited specialists by beat or language (*isiNdebele, ChiShona, English*) or click **`✨ Run Gemini Matchmaker`** on the main desk to invite a specialist into an investigation.
4. **Collaborative Investigation + Grounded AI:** Open **Media Verification (Q1/Q5)** or **Investigations & AI** to upload evidence, transcribe field audio (`Step 1C`), verify a misleading headline against the Auditor-General's report (*Before vs. After* adding a 2nd document), drag Kanban verification cards, and complete the **3-Gate Editorial & Legal Sign-Off**.
5. **News Syndication:** Open **News Exchange Wire** to request republication under `CC BY-NC-ND 4.0` (`0%` fee) or a `$120 USD` commercial license (`60% Lead / 35% Partner / 5% Platform`) and copy the attributed story package.
