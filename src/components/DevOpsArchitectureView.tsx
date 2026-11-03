"use client";

import React, { useState } from "react";
import { AuditLogEntry, Organisation } from "@/types/newsroom";
import {
  Server,
  Shield,
  Database,
  Cpu,
  GitBranch,
  Layers,
  Terminal,
  Lock,
  Activity,
} from "lucide-react";

interface DevOpsArchitectureViewProps {
  auditLogs: AuditLogEntry[];
  organisations: Organisation[];
}

const OSS_STACK_MAPPING = [
  {
    pillar: "inDrive-Style Resource Exchange",
    ossProjects: "Leihs / Snipe-IT + PostGIS + OpenStreetMap",
    role: "Peer-to-peer camera, studio, and field vehicle lending with booking windows, collateral terms, and condition handover checklists.",
    status: "Implemented in Unified Portal",
  },
  {
    pillar: "Kanban Investigation Workspace",
    ossProjects: "Plane / Planka + Matrix (Encrypted Rooms)",
    role: "5-stage cross-newsroom investigation board enforcing Human Journalist Verification Sign-Off before publication.",
    status: "Implemented in Unified Portal",
  },
  {
    pillar: "GitHub / Evidence Repo & AI Copilot",
    ossProjects: "OCCRP Aleph / ICIJ Datashare + Qdrant + LiteLLM + Ollama",
    role: "Permission-aware document ingestion, entity extraction, and page-cited RAG separating Documented Evidence from Allegations.",
    status: "Implemented with Server API + Fallback",
  },
  {
    pillar: "News & Syndication Exchange",
    ossProjects: "Superdesk Wire Protocol + Creative Commons Metadata",
    role: "Story package distribution preserving originating newsroom ownership, attribution requirements, and embargo dates.",
    status: "Implemented in Unified Portal",
  },
  {
    pillar: "Identity, Ingress & Zero-Trust Admin",
    ossProjects: "Keycloak / Authentik + Caddy HTTPS + Tailscale",
    role: "Public HTTPS access for journalists via Caddy; internal services isolated on private Docker bridge; Tailscale for sysadmin SSH/Grafana.",
    status: "Configured in docker-compose.yml",
  },
];

export default function DevOpsArchitectureView({
  auditLogs,
  organisations,
}: DevOpsArchitectureViewProps) {
  const [selectedTab, setSelectedTab] = useState<"topology" | "compose" | "audit">(
    "topology"
  );

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#11192c] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Open-Source Composable Architecture & Security Audit Trail
            </h2>
            <p className="text-xs text-slate-400">
              Modular monolith deployment profile (`docker-compose.yml` + `Caddyfile`) with multi-tenant PostgreSQL RLS & air-gapped Ollama inference
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { id: "topology", label: "OSS Stack & Topology" },
              { id: "compose", label: "Docker Compose Spec" },
              { id: "audit", label: `Immutable Audit Log (${auditLogs.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedTab === t.id
                  ? "bg-teal-500 text-slate-950 font-semibold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {selectedTab === "topology" && (
        <div className="space-y-4">
          {/* Architecture Diagram Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
                <Shield className="w-4 h-4" />
                1. Public Journalist Ingress (Caddy HTTPS)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Journalists connect via standard browser HTTPS (`Caddy 2.8`). No VPN client is required for editorial users. Strict security headers and OIDC organisation claims are validated on every request.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                <Database className="w-4 h-4" />
                2. Tenant-Isolated Data Plane (`newsroom_internal`)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                `PostgreSQL 16 + PostGIS`, `Qdrant` vector database, and `SeaweedFS` S3 object storage run on an `internal: true` Docker bridge network—never exposed to the public internet.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Cpu className="w-4 h-4" />
                3. Policy-Routed AI Gateway (LiteLLM + Ollama)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Approved public reports can query server-side `Gemini API`, while confidential leaks (`Local Inference Only`) are strictly routed to local `Ollama` containers so zero bytes leave the newsroom server.
              </p>
            </div>
          </div>

          {/* Open Source Mapping Table */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                “GitHub + Kanban + inDrive for Journalism” — Open-Source Integration Matrix
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                100% Open-Source / Self-Hostable
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2.5 px-4">Platform Pillar</th>
                    <th className="py-2.5 px-4">Open-Source Reference Projects</th>
                    <th className="py-2.5 px-4">Architectural Role</th>
                    <th className="py-2.5 px-4">Prototype Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {OSS_STACK_MAPPING.map((row) => (
                    <tr key={row.pillar} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {row.pillar}
                      </td>
                      <td className="py-3 px-4 font-mono text-teal-300">
                        {row.ossProjects}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{row.role}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px]">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedTab === "compose" && (
        <div className="rounded-xl border border-slate-800 bg-[#0a101f] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-teal-300 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              docker-compose.yml (Saved in repository root)
            </span>
            <span className="text-[11px] text-slate-400">
              Caddy + Portal + PostGIS + Qdrant + LiteLLM + Ollama + SeaweedFS
            </span>
          </div>
          <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto p-3 rounded-lg bg-slate-950 border border-slate-800 leading-relaxed">
{`services:
  caddy:
    image: caddy:2.8-alpine
    ports: ["80:80", "443:443"]
    volumes: ["./infra/Caddyfile:/etc/caddy/Caddyfile:ro"]
    networks: [public_ingress, newsroom_internal]

  portal:
    build: .
    environment:
      - DATABASE_URL=postgresql://newsroom@postgres:5432/connected_newsroom
      - QDRANT_URL=http://qdrant:6333
      - LITELLM_BASE_URL=http://litellm:4000
    networks: [newsroom_internal]

  postgres:
    image: postgis/postgis:16-3.4-alpine
    networks: [newsroom_internal] # Strictly isolated from public internet

  qdrant:
    image: qdrant/qdrant:v1.12.1
    networks: [newsroom_internal] # Enforces organisation_id & investigation_id ACLs

  litellm:
    image: ghcr.io/berriai/litellm:main-stable
    networks: [newsroom_internal]

  ollama:
    image: ollama/ollama:latest
    networks: [newsroom_internal] # Air-gapped local inference for confidential leaks`}
          </pre>
        </div>
      )}

      {selectedTab === "audit" && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              Cross-Organisation Access, AI Retrieval & Verification Audit Log
            </span>
            <span className="text-[11px] text-slate-400">
              Append-Only Compliance Trail
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Actor & Newsroom</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Audited Action</th>
                  <th className="py-2.5 px-4">Target Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {auditLogs.map((log) => {
                  const org = organisations.find((o) => o.id === log.actorOrgId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-medium text-slate-100">
                          {log.actorName}
                        </span>{" "}
                        <span className="text-[11px] text-teal-300">
                          ({org?.shortName || log.actorOrgId})
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px]">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-200">{log.action}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-sky-300">
                        {log.resourceTarget}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
