"use client";

import React, { useState } from "react";
import {
  KanbanColumnId,
  KanbanTask,
  Organisation,
} from "@/types/newsroom";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  FileCheck2,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  GripVertical,
  Send,
  Scale,
} from "lucide-react";

interface KanbanBoardProps {
  tasks: KanbanTask[];
  organisations: Organisation[];
  activeOrgId: string;
  onMoveTask: (taskId: string, newColumn: KanbanColumnId) => void;
  onSignOffTask: (taskId: string) => void;
  onAddTask: (task: Omit<KanbanTask, "id">) => void;
  onAddTaskComment?: (payload: {
    taskId: string;
    text: string;
    rightOfReplyStatus?: KanbanTask["rightOfReplyStatus"];
    evidenceRef?: string;
  }) => Promise<void>;
  investigationId: string;
}

const COLUMNS: {
  id: KanbanColumnId;
  label: string;
  subtitle: string;
  badge: string;
}[] = [
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
  onAddTaskComment,
  investigationId,
}: KanbanBoardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState("Tariro Moyo");
  const [newEvidenceRef, setNewEvidenceRef] = useState("EMA Report p. 21");

  // Drag-and-Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(
    null
  );

  // Task Detail Drawer State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyStatusInput, setReplyStatusInput] =
    useState<KanbanTask["rightOfReplyStatus"]>("Dispatched (72h Window)");
  const [evidenceRefInput, setEvidenceRefInput] = useState("");

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

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
      rightOfReplyStatus: "Not Required",
      requiresHumanSignoff: true,
    });
    setNewTitle("");
    setNewDesc("");
    setShowAddForm(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim() || !onAddTaskComment) return;
    await onAddTaskComment({
      taskId: selectedTask.id,
      text: commentText.trim(),
      rightOfReplyStatus: replyStatusInput,
      evidenceRef: evidenceRefInput || selectedTask.evidenceRef,
    });
    setCommentText("");
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
            Drag & Drop Kanban + Right-of-Reply Gate
          </span>
          <p className="text-xs text-slate-300">
            Drag cards between columns or click any card to open{" "}
            <strong className="text-teal-300">
              Evidence Notes & Right-of-Reply Logs
            </strong>
            . Moving to <strong className="text-emerald-300">Ready for Exchange</strong> requires human sign-off.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Investigation Task
        </button>
      </div>

      {/* Add Task Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl border border-teal-500/40 bg-slate-900/95 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">
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
            <label className="block text-xs text-slate-400 mb-1">
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
              <option value="Adv. Rudo Chikwanda">
                Adv. Rudo Chikwanda (Legal Review)
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
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

      {/* 5-Column Drag-and-Drop Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col.id);
          const colIdx = columnOrder.indexOf(col.id);
          const isDropTarget = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverColumn !== col.id) setDragOverColumn(col.id);
              }}
              onDragLeave={() => {
                if (dragOverColumn === col.id) setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                const taskId =
                  e.dataTransfer.getData("text/plain") || draggedTaskId;
                if (taskId) {
                  onMoveTask(taskId, col.id);
                }
                setDraggedTaskId(null);
              }}
              className={`rounded-xl border transition-all flex flex-col min-h-[400px] ${
                isDropTarget
                  ? "border-teal-400 bg-teal-950/20 ring-2 ring-teal-500/30"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-800/90 bg-slate-900/50 rounded-t-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-100">
                    {col.label}
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full border ${col.badge}`}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                  {col.subtitle}
                </p>
              </div>

              {/* Cards Stack */}
              <div className="p-2.5 space-y-2.5 flex-1">
                {colTasks.map((task) => {
                  const org = organisations.find(
                    (o) => o.id === task.assigneeOrgId
                  );
                  const commentCount = task.comments?.length || 0;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedTaskId(task.id);
                        e.dataTransfer.setData("text/plain", task.id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverColumn(null);
                      }}
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setReplyStatusInput(
                          task.rightOfReplyStatus || "Dispatched (72h Window)"
                        );
                        setEvidenceRefInput(task.evidenceRef || "");
                      }}
                      className={`p-3 rounded-lg border bg-slate-900 hover:border-teal-500/50 transition flex flex-col justify-between gap-2.5 shadow-sm cursor-grab active:cursor-grabbing ${
                        draggedTaskId === task.id
                          ? "opacity-40 border-teal-400"
                          : "border-slate-800"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${
                              org?.badgeColor || "bg-slate-800 text-slate-300"
                            }`}
                          >
                            <GripVertical className="w-2.5 h-2.5 opacity-60" />
                            {org?.shortName || "Partner"}
                          </span>
                          {task.evidenceRef && (
                            <span className="text-[11px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <FileCheck2 className="w-2.5 h-2.5" />
                              {task.evidenceRef}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {task.description}
                        </p>

                        {task.rightOfReplyStatus &&
                          task.rightOfReplyStatus !== "Not Required" && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              <Scale className="w-2.5 h-2.5" />
                              Right-of-Reply: {task.rightOfReplyStatus}
                            </div>
                          )}
                      </div>

                      <div
                        className="pt-2 border-t border-slate-800/80 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            {task.assigneeName}
                            {commentCount > 0 && (
                              <span className="text-[11px] text-teal-300 flex items-center gap-0.5">
                                <MessageSquare className="w-3 h-3" />
                                {commentCount}
                              </span>
                            )}
                          </span>
                          {task.signedOffBy ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => onSignOffTask(task.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded transition cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" />
                              Sign Off Check
                            </button>
                          )}
                        </div>

                        {task.signedOffBy && (
                          <div className="text-[11px] text-emerald-400/90 bg-slate-950/60 px-2 py-1 rounded border border-emerald-500/20">
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
                            className="p-1 rounded bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ArrowLeft className="w-3 h-3" /> Prev
                          </button>
                          <button
                            onClick={() => setSelectedTaskId(task.id)}
                            className="text-[11px] text-slate-400 hover:text-teal-300 underline cursor-pointer"
                          >
                            Open Notes ({commentCount})
                          </button>
                          <button
                            disabled={colIdx === columnOrder.length - 1}
                            onClick={() =>
                              onMoveTask(task.id, columnOrder[colIdx + 1])
                            }
                            className="px-2 py-1 rounded bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 disabled:opacity-30 text-teal-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Next <ArrowRight className="w-3 h-3" />
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

      {/* Task Detail, Right-of-Reply & Cross-Newsroom Comment Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-teal-500/50 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-teal-400">
                  Investigation Task & Right-of-Reply Log • Assignee:{" "}
                  {selectedTask.assigneeName}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedTask.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedTask.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Comments Thread */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div className="text-xs font-semibold text-slate-300">
                Cross-Newsroom Verification Notes (
                {selectedTask.comments?.length || 0})
              </div>
              {(!selectedTask.comments ||
                selectedTask.comments.length === 0) && (
                <div className="text-xs text-slate-500 italic p-3 rounded bg-slate-900/60 border border-slate-800">
                  No verification notes logged yet. Add a primary source check or Right-of-Reply log below.
                </div>
              )}
              {selectedTask.comments?.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-xs text-teal-300">
                    <strong>
                      {c.authorName} ({c.authorOrgId})
                    </strong>
                    <span className="font-mono text-slate-400">
                      {c.createdAt}
                    </span>
                  </div>
                  <p className="text-slate-200">{c.text}</p>
                </div>
              ))}
            </div>

            {/* Add Comment & Update Right-of-Reply Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Right-of-Reply Status
                  </label>
                  <select
                    value={replyStatusInput}
                    onChange={(e) =>
                      setReplyStatusInput(
                        e.target.value as KanbanTask["rightOfReplyStatus"]
                      )
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="Not Required">Not Required</option>
                    <option value="Dispatched (72h Window)">
                      Dispatched (72h Window)
                    </option>
                    <option value="Response Logged">Response Logged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Linked Primary Evidence Citation
                  </label>
                  <input
                    type="text"
                    value={evidenceRefInput}
                    onChange={(e) => setEvidenceRefInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Log a verification note, lab check, or Right-of-Reply response..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Log Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
