"use client";

import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  FolderGit2,
  CheckCircle2,
  Layers,
  Terminal,
  Maximize2,
  X,
} from "lucide-react";
import type { OpenSourceAppIntegration } from "@/app/api/integrations/status/route";

interface OpenSourceAppsBridgeProps {
  filterModule?: "gear" | "kanban" | "ocr" | "ai" | "all";
  compact?: boolean;
}

export default function OpenSourceAppsBridge({
  filterModule = "all",
  compact = true,
}: OpenSourceAppsBridgeProps) {
  const [apps, setApps] = useState<OpenSourceAppIntegration[]>([]);
  const [embeddedApp, setEmbeddedApp] =
    useState<OpenSourceAppIntegration | null>(null);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((data) => {
        if (data?.apps) setApps(data.apps);
      })
      .catch(() => {
        // Ignore offline fetch error
      });
  }, []);

  const visibleApps =
    filterModule === "all"
      ? apps
      : apps.filter((a) =>
          filterModule === "ai"
            ? a.moduleMapped === "ai" || a.moduleMapped === "ocr"
            : a.moduleMapped === filterModule
        );

  if (visibleApps.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-teal-500/25 bg-slate-900/90 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <FolderGit2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white">
                Linked Open-Source Engine{visibleApps.length > 1 ? "s" : ""} (Cloned in <code className="text-teal-300 font-mono">./external-apps/</code>)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Imported & Linked
              </span>
            </div>
            {!compact && (
              <p className="text-xs text-slate-400 mt-0.5">
                Ready-made open-source repositories imported into this project and linked via Docker Compose & API routes.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visibleApps.map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs"
            >
              <span className="font-semibold text-teal-300">{app.name}</span>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                ({app.localClonePath})
              </span>
              <button
                onClick={() =>
                  setEmbeddedApp(embeddedApp?.id === app.id ? null : app)
                }
                className="ml-1 px-2 py-0.5 rounded bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                title={`Embed ${app.name} (${app.serviceUrl})`}
              >
                <Maximize2 className="w-3 h-3" />
                {embeddedApp?.id === app.id ? "Hide Frame" : "Embed UI"}
              </button>
              <a
                href={app.serviceUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                title={`Open ${app.serviceUrl} in new tab`}
              >
                {app.serviceUrl.replace("http://", "")}
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={app.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white px-1 text-[11px]"
                title="View Upstream GitHub Repo"
              >
                GitHub
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Live Open-Source App Frame */}
      {embeddedApp && (
        <div className="rounded-2xl border border-teal-500/40 bg-[#0b1120] overflow-hidden shadow-2xl">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-white">
                {embeddedApp.name} — {embeddedApp.role}
              </span>
              <span className="text-[11px] font-mono text-teal-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {embeddedApp.localClonePath} → {embeddedApp.serviceUrl}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden md:inline flex items-center gap-1">
                <Terminal className="w-3 h-3 inline mr-1 text-teal-400" />
                Start container:{" "}
                <code className="text-amber-300 font-mono">
                  docker compose up -d {embeddedApp.dockerService}
                </code>
              </span>
              <a
                href={embeddedApp.serviceUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1"
              >
                Open Full Window <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setEmbeddedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span>{embeddedApp.description}</span>
            <span className="text-[11px] font-mono text-emerald-400">
              Status: {embeddedApp.status}
            </span>
          </div>
          <iframe
            src={embeddedApp.serviceUrl}
            title={embeddedApp.name}
            className="w-full h-[520px] bg-slate-950 border-0"
          />
        </div>
      )}
    </div>
  );
}
