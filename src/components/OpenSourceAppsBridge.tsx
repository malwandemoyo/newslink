"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Maximize2, X } from "lucide-react";
import type { OpenSourceAppIntegration } from "@/app/api/integrations/status/route";

interface OpenSourceAppsBridgeProps {
  filterModule?: "gear" | "kanban" | "ocr" | "ai" | "all";
  compact?: boolean;
}

export default function OpenSourceAppsBridge({
  filterModule = "all",
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
      .catch(() => {});
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        {visibleApps.map((app) => (
          <div
            key={app.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
          >
            <span className="font-semibold text-slate-200">{app.name}</span>
            <button
              onClick={() =>
                setEmbeddedApp(embeddedApp?.id === app.id ? null : app)
              }
              className="ml-1 px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              {embeddedApp?.id === app.id ? "Close View" : "Split View"}
            </button>
            <a
              href={app.serviceUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs inline-flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>

      {embeddedApp && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              {embeddedApp.name}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={embeddedApp.serviceUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1"
              >
                Full Screen <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setEmbeddedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <iframe
            src={embeddedApp.serviceUrl}
            title={embeddedApp.name}
            className="w-full h-[540px] bg-slate-950 border-0"
          />
        </div>
      )}
    </div>
  );
}
