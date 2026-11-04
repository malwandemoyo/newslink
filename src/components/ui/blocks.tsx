"use client";

import React from "react";

/**
 * Reusable shadcn / blocks.so building blocks for NewsLink
 * - Stats01: Divided 4-column KPI strip
 * - Card / CardHeader / CardContent / CardFooter: Structured bordered containers
 * - Badge: Semantic status pills
 * - SectionHeader: Page & section title bar with right-aligned actions
 */

export interface StatItem {
  label: string;
  value: string;
  change?: string;
  changeTone?: "positive" | "neutral" | "warning";
  detail?: string;
  onClick?: () => void;
}

export function BlocksStatsGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {items.map((item, idx) => {
        const toneClass =
          item.changeTone === "positive"
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            : item.changeTone === "warning"
            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
            : "bg-slate-800 text-slate-300 border-slate-700";

        return (
          <div
            key={idx}
            onClick={item.onClick}
            className={`p-5 flex flex-col justify-between gap-2 ${
              item.onClick ? "hover:bg-slate-800/40 cursor-pointer transition" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-400">
                {item.label}
              </span>
              {item.change && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border tabular-nums ${toneClass}`}
                >
                  {item.change}
                </span>
              )}
            </div>
            <div className="text-2xl font-semibold text-slate-50 tabular-nums">
              {item.value}
            </div>
            {item.detail && (
              <div className="text-xs text-slate-400 truncate">
                {item.detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BlockCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col ${className}`}
    >
      {children}
    </div>
  );
}

export function BlockCardHeader({
  title,
  description,
  badge,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function BlockCardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-5 flex-1 ${className}`}>{children}</div>;
}

export function BlockCardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

export function BlockBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "teal" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    neutral: "bg-slate-800/80 text-slate-300 border-slate-700",
    teal: "bg-teal-500/10 text-teal-300 border-teal-500/25",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/25",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border tabular-nums ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
