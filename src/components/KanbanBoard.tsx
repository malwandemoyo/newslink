"use client";

import React, { useState } from "react";
import {
  KanbanColumnId,
  KanbanTask,
  Organisation,
} from "@/types/newsroom";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  FileCheck2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

interface KanbanBoardProps {
  tasks: KanbanTask[];
  organisations: Organisation[];
  activeOrgId: string;
  onMoveTask: (taskId: string, newColumn: KanbanColumnId) => void;
  onSignOffTask: (taskId: string) => void;
  onAddTask: (task: Omit<KanbanTask, "id">) => void;
  investigationId: string;
}

const COLUMNS: { id: KanbanColumnId; label: string; subtitle: string; badge: string }[] = [
  {
    id: "leads",
    label: "1. Source Leads",
    subtitle: "Tips, procurement flags & initial registry checks",
    badge: "border-slate-700 text-slate-300",
  },
  {
    id: "verification",
    label: "2. Document Verification",
    subtitle: "Cross-check AI citations against raw primary PDFs",
    badge: "border-sky-500/40 text-sky-300",
  },
  {
    id: "fieldwork",
    label: "3. Field Reporting",
    subtitle: "On-ground interviews, lab sampling & camera reels",
    badge: "border-amber-500/40 text-amber-300",
  },
  {
    id: "editorial_review",
    label: "4. Editorial & Legal Review",
    subtitle: "Right-of-Reply dispatches & defamation vetting",
    badge: "border-purple-500/40 text-purple-300",
  },
  {
    id: "syndication_ready",
    label: "5. Ready for Exchange",
    subtitle: "Human-verified & signed off for publication",
    badge: "border-emerald-500/40 text-emerald-300",
  },
];

export default function KanbanBoard({
  tasks,
  organisations,
  activeOrgId,
  onMoveTask,
  onSignOffTask,
  onAddTask,
  investigationId,
}: KanbanBoardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState("Tariro Moyo");
  const [newEvidenceRef, setNewEvidenceRef] = useState("EMA Report p. 21");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      investigationId,
      title: newTitle.trim(),
      description: newDesc.trim() || "Cross-organisation verification task.",
      column: "leads",
      assigneeName: newAssignee,
      assigneeOrgId: activeOrgId,
      priority: "High",
      evidenceRef: newEvidenceRef || "Primary Dossier",
      requiresHumanSignoff: true,
    });
    setNewTitle("");
    setNewDesc("");
    setShowAddForm(false);
  };

  const columnOrder: KanbanColumnId[] = [
    "leads",
    "verification",
    "fieldwork",
    "editorial_review",
    "syndication_ready",
  ];

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-teal-500/15 text-teal-300 border border-teal-500/30">
            Plane / Planka OSS Kanban Workflow
          </span>
          <p className="text-xs text-slate-300">
            Every card moving into <strong className="text-emerald-300">Ready for Exchange</strong> requires{" "}
            <span className="underline decoration-teal-500/60">Human Journalist Verification Sign-Off</span>.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Investigation Task
        </button>
      </div>

      {/* Optional Add Task Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl border border-teal-500/40 bg-slate-900/95 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <div className="md:col-span-2">
            <label className="block text-[11px] text-slate-400 mb-1">
              Task Title (Verification / Fieldwork / Legal Step)
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Verify ZINWA catchment flow meter calibration certificate"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Assigned Collaborator
            </label>
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100"
            >
              <option value="Sipho Ncube">Sipho Ncube (Matabeleland Ind.)</option>
              <option value="Tariro Moyo">Tariro Moyo (Harare Collective)</option>
              <option value="Nqobile Dube">Nqobile Dube (CITE ZW)</option>
              <option value="Adv. Rudo Chikwanda">Adv. Rudo Chikwanda (Legal Review)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Primary Source Citation Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newEvidenceRef}
                onChange={(e) => setNewEvidenceRef(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs shrink-0 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 5-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col.id);
          const colIdx = columnOrder.indexOf(col.id);

          return (
            <div
              key={col.id}
              className="rounded-xl border border-slate-800 bg-[#0f172a] flex flex-col min-h-[380px]"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-800/90 bg-slate-900/50 rounded-t-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-100">
                    {col.label}
                  </span>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${col.badge}`}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  {col.subtitle}
                </p>
              </div>

              {/* Cards Stack */}
              <div className="p-2.5 space-y-2.5 flex-1">
                {colTasks.map((task) => {
                  const org = organisations.find(
                    (o) => o.id === task.assigneeOrgId
                  );
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-slate-800 bg-[#131d33] hover:border-slate-700 transition flex flex-col justify-between gap-2.5 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                              org?.badgeColor || "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {org?.shortName || "Partner"}
                          </span>
                          {task.evidenceRef && (
                            <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <FileCheck2 className="w-2.5 h-2.5" />
                              {task.evidenceRef}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 font-medium">
                            {task.assigneeName}
                          </span>
                          {task.signedOffBy ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3" />
                              Human Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => onSignOffTask(task.id)}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded transition cursor-pointer"
                              title="Record human editorial verification sign-off"
                            >
                              <UserCheck className="w-3 h-3" />
                              Sign Off Check
                            </button>
                          )}
                        </div>

                        {task.signedOffBy && (
                          <div className="text-[10px] text-emerald-400/90 bg-slate-950/60 px-2 py-1 rounded border border-emerald-500/20">
                            ✓ {task.signedOffBy}
                          </div>
                        )}

                        {/* Stage Move Controls */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            disabled={colIdx === 0}
                            onClick={() =>
                              onMoveTask(task.id, columnOrder[colIdx - 1])
                            }
                            className="p-1 rounded bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ArrowLeft className="w-3 h-3" /> Prev
                          </button>
                          <button
                            disabled={colIdx === columnOrder.length - 1}
                            onClick={() =>
                              onMoveTask(task.id, columnOrder[colIdx + 1])
                            }
                            className="px-2 py-1 rounded bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 disabled:opacity-30 text-teal-300 text-[10px] font-medium flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Advance Stage <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
