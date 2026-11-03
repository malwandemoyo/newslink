"use client";

import React from "react";
import { AuditLogEntry, Organisation, Investigation } from "@/types/newsroom";
import { Shield, Lock, Activity, CheckCircle2, Building2 } from "lucide-react";

interface SecurityAuditViewProps {
  auditLogs: AuditLogEntry[];
  organisations: Organisation[];
  investigations: Investigation[];
  activeOrgId: string;
}

export default function SecurityAuditView({
  auditLogs,
  organisations,
  investigations,
  activeOrgId,
}: SecurityAuditViewProps) {
  return (
    <div className="space-y-6">
      {/* Multi-Organisation Access Matrix */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <h2 className="text-xs font-bold text-white">
              Multi-Organisation Row-Level Security & Workspace Access Control Matrix
            </h2>
          </div>
          <span className="text-[11px] font-mono text-teal-300">
            Active Context: {activeOrgId}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="py-2.5 px-4">Investigation Workspace</th>
                <th className="py-2.5 px-4">Lead Newsroom</th>
                {organisations.map((o) => (
                  <th key={o.id} className="py-2.5 px-4">
                    {o.shortName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {investigations.map((inv) => {
                const lead = organisations.find((o) => o.id === inv.leadOrgId);
                return (
                  <tr key={inv.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-teal-300">
                        {inv.codeName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {inv.title}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {lead?.name}
                    </td>
                    {organisations.map((org) => {
                      const isLead = inv.leadOrgId === org.id;
                      const isPartner = inv.partnerOrgIds.includes(org.id);
                      return (
                        <td key={org.id} className="py-3 px-4">
                          {isLead ? (
                            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Owner / Admin
                            </span>
                          ) : isPartner ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Co-Investigator
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Isolated (403)
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Append-Only SQLite Security & Verification Audit Log */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Immutable SQLite Audit Log ({auditLogs.length} Recorded Events)
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            Persisted in data/connected_newsroom.sqlite
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
                <th className="py-2.5 px-4">Target ID</th>
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
    </div>
  );
}
