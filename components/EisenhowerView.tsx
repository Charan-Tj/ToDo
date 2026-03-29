"use client";

import { Card, List } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, Clock, Trash2, Calendar, Plus, X } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "./Toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useState, useEffect, useRef } from "react";

type QuadrantId = "q1" | "q2" | "q3" | "q4";

type Quadrant = {
  id: QuadrantId;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  headerColor: string;
  borderColor: string;
  badgeBg: string;
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

  // Optimistic local state — syncs when server data refreshes
  const [localCards, setLocalCards] = useState<Card[]>(cards);
  useEffect(() => { setLocalCards(cards); }, [cards]);

  // Add card state: which quadrant is open + which list is selected + title input
  const [addingIn, setAddingIn] = useState<QuadrantId | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // When opening an add form, default to first list and focus input
  const openAddCard = (qId: QuadrantId) => {
    setAddingIn(qId);
    setNewTitle("");
    setSelectedListId(lists[0]?.id ?? "");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAddCard = async (e: React.FormEvent, q: Quadrant) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedListId) return;
    setAdding(true);
    try {
      const cardsInList = localCards.filter(c => c.list_id === selectedListId);
      const pos = cardsInList.length > 0 ? Math.max(...cardsInList.map(c => c.position)) + 1000 : 1000;
      const created = await db.createCard(selectedListId, newTitle.trim(), pos);
      // Apply quadrant labels immediately
      const labels = applyQuadrantLabels([], q);
      if (labels.length > 0) {
        await db.updateCard(created.id, { labels });
      }
      setAddingIn(null);
      setNewTitle("");
      onRefresh();
      toast("Card added", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setAdding(false);
    }
  };

  const getListName = (listId: string) => lists.find(l => l.id === listId)?.title ?? "";

  const handleToggleComplete = async (e: React.MouseEvent, card: Card) => {
    e.stopPropagation();
    try {
      const currentLabels = card.labels ?? [];
      const isCompleted = currentLabels.includes('done');
      const newLabels = isCompleted
        ? currentLabels.filter(l => l !== 'done')
        : [...currentLabels, 'done'];
      // Optimistic
      setLocalCards(prev => prev.map(c => c.id === card.id ? { ...c, labels: newLabels } : c));
      await db.updateCard(card.id, { labels: newLabels });
      onRefresh();
    } catch (err) {
      toast((err as Error).message, "error");
      onRefresh(); // rollback via server state
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const destQuadrant = QUADRANTS.find(q => q.id === destination.droppableId);
    if (!destQuadrant) return;

    const card = localCards.find(c => c.id === draggableId);
    if (!card) return;

    const newLabels = applyQuadrantLabels(card.labels ?? [], destQuadrant);

    // ✅ Optimistic update
    const previousCards = localCards;
    setLocalCards(prev =>
      prev.map(c => c.id === draggableId ? { ...c, labels: newLabels } : c)
    );

    try {
      await db.updateCard(card.id, { labels: newLabels });
      onRefresh();
    } catch (err) {
      setLocalCards(previousCards); // ❌ rollback
      toast((err as Error).message, "error");
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 p-4 overflow-auto custom-scrollbar relative z-10">
        <div className="grid grid-cols-2 gap-3" style={{ minHeight: 'calc(100vh - 130px)', gridTemplateRows: '1fr 1fr' }}>
          {QUADRANTS.map((q, qi) => {
            const qCards = localCards
              .filter(c => q.match(c.labels ?? []))
              .sort((a, b) => a.position - b.position);
            const isAddingHere = addingIn === q.id;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.07 }}
                className={`bg-[var(--bg-elevated)] border ${q.borderColor} rounded-xl flex flex-col overflow-hidden`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${q.headerColor} bg-[var(--bg-muted)] shrink-0`}>
                  <div className="flex items-center gap-2">
                    {q.icon}
                    <div>
                      <div className="text-sm font-bold text-[var(--text)]">{q.label}</div>
                      <div className="text-xs text-[var(--text-muted)]">{q.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${q.badgeBg} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center`}>
                      {qCards.length}
                    </span>
                    <button
                      onClick={() => isAddingHere ? setAddingIn(null) : openAddCard(q.id)}
                      title="Add card to this quadrant"
                      className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    >
                      {isAddingHere ? <X size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
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
                      {qCards.length === 0 && !snapshot.isDraggingOver && !isAddingHere && (
                        <div className="flex flex-col items-center justify-center text-[var(--text-muted)] text-xs italic py-4 gap-1 select-none">
                          <span className="text-xl opacity-30">☐</span>
                          <span>Drop cards here or click +</span>
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

                      {/* Inline add card form */}
                      <AnimatePresence>
                        {isAddingHere && (
                          <motion.form
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            onSubmit={(e) => handleAddCard(e, q)}
                            className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-2.5 flex flex-col gap-2 mt-1"
                          >
                            <input
                              ref={inputRef}
                              value={newTitle}
                              onChange={e => setNewTitle(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Escape') setAddingIn(null); }}
                              placeholder="Card title..."
                              className="input-base text-sm py-1.5"
                            />
                            {lists.length > 1 && (
                              <select
                                value={selectedListId}
                                onChange={e => setSelectedListId(e.target.value)}
                                className="input-base text-sm py-1.5 bg-[var(--bg-muted)]"
                              >
                                {lists.map(l => (
                                  <option key={l.id} value={l.id}>{l.title}</option>
                                ))}
                              </select>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={adding || !newTitle.trim()}
                                className="btn btn-primary text-xs px-3 py-1.5 flex-1"
                              >
                                {adding ? '...' : 'Add card'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddingIn(null)}
                                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-muted)] rounded transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </Droppable>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center text-xs text-[var(--text-muted)]">
          <span>Click <strong className="text-[var(--text)]">+</strong> in any quadrant to add a card • Drag cards between quadrants to reclassify</span>
        </div>
      </div>
    </DragDropContext>
  );
}
