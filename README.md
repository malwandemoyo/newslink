# Connected Newsroom

> **Stronger newsrooms. Better journalism.**
> An open-source, AI-assisted collaboration platform connecting independent media organisations through shared resources, expertise exchange, collaborative investigations, and content distribution.

## Mental Model: "GitHub + Kanban + inDrive for Independent Journalism"

1. **inDrive-Style Peer-to-Peer Resource Exchange (`Leihs` / `Snipe-IT` + `PostGIS` + `OpenStreetMap`)**
   - List idle cameras, audio recorders, drones, vehicles, and broadcast studios.
   - Request bookings with transparent peer-exchange terms, approve requests across newsrooms, and record handover/return equipment condition.
2. **Plane/Planka-Style Collaborative Investigation Kanban**
   - Private-by-default multi-newsroom investigation workspaces.
   - 5-stage verification board (*Source Leads → Document Verification → Field Reporting → Editorial & Legal Review → Ready for Exchange*) enforcing **Human Journalist Verification Sign-Off**.
3. **GitHub / OCCRP Aleph-Style Evidence Repo & Grounded AI Copilot**
   - Ingest approved PDFs/reports, extract entities (People, Organisations, Locations, Dates), and run permission-aware RAG queries.
   - Distinguishes **Documented Evidence** from **Unverified Allegations** with clickable page/section citations and side-by-side primary source inspection.
   - Enforces strict cross-organisation ACLs (HTTP 403 when querying restricted documents from another newsroom) and routes confidential documents to **air-gapped local Ollama** via LiteLLM.
4. **Superdesk-Style News Exchange**
   - Share human-verified story packages with Creative Commons / syndication licensing, embargo enforcement, and mandatory attribution.

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to explore the interactive 7-step demo journey (**"A Story That Takes a Network"**).

## Self-Hosted DevOps Deployment (`docker-compose.yml`)

```bash
docker compose up -d
```

Includes:
- `caddy`: Public HTTPS reverse proxy (`infra/Caddyfile`)
- `portal`: Connected Newsroom Next.js Unified Portal
- `postgres`: PostgreSQL 16 + PostGIS on isolated `newsroom_internal` bridge network
- `qdrant`: Vector search enforcing `organisation_id` and `investigation_id` ACL filters
- `litellm` + `ollama`: Local-first AI gateway for confidential source material
- `storage`: SeaweedFS S3-compatible private evidence storage
