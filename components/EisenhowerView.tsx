"use client";

import { Card, List } from "@/lib/types";
import { motion } from "framer-motion";
import { Check, AlertTriangle, Clock, Trash2, Calendar } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "./Toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type QuadrantId = "q1" | "q2" | "q3" | "q4";

type Quadrant = {
  id: QuadrantId;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  headerColor: string;
  borderColor: string;
  badgeBg: string;
  // Labels this quadrant requires (derived)
  hasUrgent: boolean;
  hasImportant: boolean;
  match: (labels: string[]) => boolean;
};

const QUADRANTS: Quadrant[] = [
  {
    id: "q1", label: "Do First", subtitle: "Urgent & Important",
    icon: <AlertTriangle size={16} className="text-[#EB5A46]" />,
    headerColor: "border-[#EB5A46]", borderColor: "border-[#EB5A46]/40",
    badgeBg: "bg-[#EB5A46]",
    hasUrgent: true, hasImportant: true,
    match: (l) => l.includes("urgent") && l.includes("important"),
  },
  {
    id: "q2", label: "Schedule", subtitle: "Not Urgent & Important",
    icon: <Calendar size={16} className="text-[#579dff]" />,
    headerColor: "border-[#579dff]", borderColor: "border-[#579dff]/40",
    badgeBg: "bg-[#579dff]",
    hasUrgent: false, hasImportant: true,
    match: (l) => !l.includes("urgent") && l.includes("important"),
  },
  {
    id: "q3", label: "Delegate", subtitle: "Urgent & Not Important",
    icon: <Clock size={16} className="text-[#F5A623]" />,
    headerColor: "border-[#F5A623]", borderColor: "border-[#F5A623]/40",
    badgeBg: "bg-[#F5A623]",
    hasUrgent: true, hasImportant: false,
    match: (l) => l.includes("urgent") && !l.includes("important"),
  },
  {
    id: "q4", label: "Eliminate", subtitle: "Not Urgent & Not Important",
    icon: <Trash2 size={16} className="text-[var(--text-muted)]" />,
    headerColor: "border-[var(--border)]", borderColor: "border-[var(--border)]",
    badgeBg: "bg-[var(--text-muted)]",
    hasUrgent: false, hasImportant: false,
    match: (l) => !l.includes("urgent") && !l.includes("important"),
  },
];

/** Compute the new labels array when moving a card to a target quadrant */
function applyQuadrantLabels(currentLabels: string[], q: Quadrant): string[] {
  let labels = currentLabels.filter(l => l !== 'urgent' && l !== 'important');
  if (q.hasUrgent) labels = [...labels, 'urgent'];
  if (q.hasImportant) labels = [...labels, 'important'];
  return labels;
}

export function EisenhowerView({
  cards, lists, onOpenCard, onRefresh,
}: {
  cards: Card[];
  lists: List[];
  onOpenCard: (id: string) => void;
  onRefresh: () => void;
}) {
  const toast = useToast();

  const getListName = (listId: string) => lists.find(l => l.id === listId)?.title ?? "";

  const handleToggleComplete = async (e: React.MouseEvent, card: Card) => {
    e.stopPropagation();
    try {
      const currentLabels = card.labels ?? [];
      const isCompleted = currentLabels.includes('done');
      const newLabels = isCompleted
        ? currentLabels.filter(l => l !== 'done')
        : [...currentLabels, 'done'];
      await db.updateCard(card.id, { labels: newLabels });
      onRefresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return; // same quadrant, no change needed

    const destQuadrant = QUADRANTS.find(q => q.id === destination.droppableId);
    if (!destQuadrant) return;

    const card = cards.find(c => c.id === draggableId);
    if (!card) return;

    const newLabels = applyQuadrantLabels(card.labels ?? [], destQuadrant);

    try {
      await db.updateCard(card.id, { labels: newLabels });
      onRefresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 p-4 overflow-auto custom-scrollbar relative z-10">
        <div className="grid grid-cols-2 gap-3" style={{ minHeight: 'calc(100vh - 130px)', gridTemplateRows: '1fr 1fr' }}>
          {QUADRANTS.map((q, qi) => {
            const qCards = cards
              .filter(c => q.match(c.labels ?? []))
              .sort((a, b) => a.position - b.position);

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.07 }}
                className={`bg-[var(--bg-elevated)] border ${q.borderColor} rounded-xl flex flex-col overflow-hidden`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b ${q.headerColor} bg-[var(--bg-muted)] shrink-0`}>
                  <div className="flex items-center gap-2">
                    {q.icon}
                    <div>
                      <div className="text-sm font-bold text-[var(--text)]">{q.label}</div>
                      <div className="text-xs text-[var(--text-muted)]">{q.subtitle}</div>
                    </div>
                  </div>
                  <span className={`${q.badgeBg} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center`}>
                    {qCards.length}
                  </span>
                </div>

                {/* Droppable card area */}
                <Droppable droppableId={q.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[var(--primary)]/5 ring-1 ring-inset ring-[var(--primary)]/20' : ''
                      }`}
                    >
                      {qCards.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] text-xs italic py-6 gap-1 select-none">
                          <span className="text-2xl opacity-30">☐</span>
                          <span>Drop cards here</span>
                        </div>
                      )}

                      {qCards.map((card, idx) => {
                        const isCompleted = (card.labels ?? []).includes('done');
                        return (
                          <Draggable key={card.id} draggableId={card.id} index={idx}>
                            {(drag, dragSnap) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                onClick={() => onOpenCard(card.id)}
                                className={`group relative bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--primary)]/40
                                  rounded-lg px-3 py-2.5 cursor-pointer transition-all select-none
                                  ${isCompleted ? 'opacity-50' : ''}
                                  ${dragSnap.isDragging ? 'shadow-xl rotate-1 ring-2 ring-[var(--primary)] z-50 bg-[var(--bg-elevated)]' : ''}`}
                                style={drag.draggableProps.style}
                              >
                                {/* Tick button */}
                                <button
                                  onClick={(e) => handleToggleComplete(e, card)}
                                  title={isCompleted ? "Mark incomplete" : "Mark complete"}
                                  className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    opacity-0 group-hover:opacity-100 transition-all z-10
                                    ${isCompleted
                                      ? 'bg-[#1F845A] border-[#1F845A] text-white !opacity-100'
                                      : 'border-[var(--text-muted)] hover:border-[#1F845A] hover:bg-[#1F845A]/20 text-transparent hover:text-[#1F845A]'
                                    }`}
                                >
                                  <Check size={11} strokeWidth={3} />
                                </button>

                                <p className={`text-sm text-[var(--text)] font-medium leading-snug pr-6 ${isCompleted ? 'line-through text-[var(--text-muted)]' : ''}`}>
                                  {card.title}
                                </p>

                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                                    {getListName(card.list_id)}
                                  </span>
                                  {card.due_date && (
                                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                                      <Clock size={10} />
                                      {new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                  {card.assignee && (
                                    <span className="ml-auto w-5 h-5 rounded-full bg-[#1F845A] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                      {card.assignee.substring(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center text-xs text-[var(--text-muted)]">
          <span>Open a card → Labels → toggle <strong className="text-[var(--text)]">Urgent</strong> or <strong className="text-[var(--text)]">Important</strong> • Drag cards between quadrants to reclassify</span>
        </div>
      </div>
    </DragDropContext>
  );
}
