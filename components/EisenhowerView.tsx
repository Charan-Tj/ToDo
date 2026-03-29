"use client";

import { Card, List } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, Clock, Trash2, Calendar, Plus, X, Inbox, ChevronRight, Wand2, Send, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "./Toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useState, useEffect, useRef } from "react";



type Quadrant = {
  id: string;
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
    match: (l) => (l.includes("urgent") || l.includes("important")) ? false : l.includes("classified"),
  },
];

function applyQuadrantLabels(currentLabels: string[], q: Quadrant): string[] {
  let labels = currentLabels.filter(l => l !== 'urgent' && l !== 'important' && l !== 'classified');
  labels = [...labels, 'classified'];
  if (q.hasUrgent) labels = [...labels, 'urgent'];
  if (q.hasImportant) labels = [...labels, 'important'];
  return labels;
}

function stripClassification(currentLabels: string[]): string[] {
  return currentLabels.filter(l => l !== 'urgent' && l !== 'important' && l !== 'classified');
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
  const [localCards, setLocalCards] = useState<Card[]>(cards);
  useEffect(() => { setLocalCards(cards); }, [cards]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inboxInputRef = useRef<HTMLInputElement>(null);
  const [inboxTitle, setInboxTitle] = useState("");
  const [addingToInbox, setAddingToInbox] = useState(false);

  // AI State
  const [aiText, setAiText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPlotting, setIsPlotting] = useState(false);

  const handleAIExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiText.trim() || !lists[0]) return;
    setIsExtracting(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", payload: { text: aiText } })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const tasks: string[] = data.result;
      if (!tasks || !tasks.length) throw new Error("No tasks found");

      const listId = selectedListId || lists[0].id;
      for (const t of tasks) {
        await db.createCard(listId, t, 999999); 
      }
      setAiText("");
      onRefresh();
      toast(`Extracted ${tasks.length} tasks!`, "success");
    } catch(err) {
      toast((err as Error).message, "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAIPlot = async () => {
    if (!inboxCards.length) return;
    setIsPlotting(true);
    try {
      const payloadTasks = inboxCards.map(c => ({ id: c.id, title: c.title }));
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "classify", payload: { tasks: payloadTasks } })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const classifications: {id: string, quadrant: string}[] = data.result;
      
      for (const cls of classifications) {
        const q = QUADRANTS.find(quad => quad.id === cls.quadrant);
        if (q) {
           const card = localCards.find(c => c.id === cls.id);
           if (card) {
              const newLabels = applyQuadrantLabels(card.labels ?? [], q);
              await db.updateCard(cls.id, { labels: newLabels });
           }
        }
      }
      onRefresh();
      toast(`Auto-plotted ${classifications.length} tasks!`, "success");
    } catch(err) {
      toast((err as Error).message, "error");
    } finally {
      setIsPlotting(false);
    }
  };

  const openAddCard = (qId: string) => {
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
      const labels = applyQuadrantLabels([], q);
      if (labels.length > 0) await db.updateCard(created.id, { labels });
      setAddingIn(null);
      setNewTitle("");
      onRefresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setAdding(false);
    }
  };

  const handleAddToInbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxTitle.trim() || !lists[0]) return;
    setAddingToInbox(true);
    try {
      const listId = selectedListId || lists[0].id;
      const cardsInList = localCards.filter(c => c.list_id === listId);
      const pos = cardsInList.length > 0 ? Math.max(...cardsInList.map(c => c.position)) + 1000 : 1000;
      await db.createCard(listId, inboxTitle.trim(), pos);
      setInboxTitle("");
      inboxInputRef.current?.focus();
      onRefresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setAddingToInbox(false);
    }
  };

  const getListName = (listId: string) => lists.find(l => l.id === listId)?.title ?? "";

  const handleToggleComplete = async (e: React.MouseEvent, card: Card) => {
    e.stopPropagation();
    const currentLabels = card.labels ?? [];
    const isCompleted = currentLabels.includes('done');
    const newLabels = isCompleted
      ? currentLabels.filter(l => l !== 'done')
      : [...currentLabels, 'done'];
    setLocalCards(prev => prev.map(c => c.id === card.id ? { ...c, labels: newLabels } : c));
    try {
      await db.updateCard(card.id, { labels: newLabels });
    } catch (err) {
      setLocalCards(prev => prev.map(c => c.id === card.id ? { ...c, labels: currentLabels } : c));
      toast((err as Error).message, "error");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const card = localCards.find(c => c.id === draggableId);
    if (!card) return;

    const isDroppedToInbox = destination.droppableId === "inbox";
    const destQuadrant = QUADRANTS.find(q => q.id === destination.droppableId);

    if (!isDroppedToInbox && !destQuadrant) return;

    const newLabels = isDroppedToInbox
      ? stripClassification(card.labels ?? [])
      : applyQuadrantLabels(card.labels ?? [], destQuadrant!);

    const previousCards = localCards;
    setLocalCards(prev =>
      prev.map(c => c.id === draggableId ? { ...c, labels: newLabels } : c)
    );

    try {
      await db.updateCard(card.id, { labels: newLabels });
      // No re-fetch — realtime handles cross-user sync
    } catch (err) {
      setLocalCards(previousCards); // rollback
      toast((err as Error).message, "error");
    }
  };

  // Inbox = cards not yet classified (no 'classified', no 'urgent', no 'important')
  const inboxCards = localCards
    .filter(c => {
      const l = c.labels ?? [];
      return !l.includes('urgent') && !l.includes('important') && !l.includes('classified');
    })
    .sort((a, b) => a.position - b.position);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* Main 2x2 Matrix */}
        <div className="flex-1 p-4 overflow-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-3 h-full" style={{ minHeight: 'calc(100vh - 130px)', gridTemplateRows: '1fr 1fr' }}>
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
                  transition={{ delay: qi * 0.06 }}
                  className={`bg-[var(--bg-elevated)] border ${q.borderColor} rounded-xl flex flex-col overflow-hidden`}
                >
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b ${q.headerColor} bg-[var(--bg-muted)] shrink-0`}>
                    <div className="flex items-center gap-2">
                      {q.icon}
                      <div>
                        <div className="text-sm font-bold text-[var(--text)]">{q.label}</div>
                        <div className="text-xs text-[var(--text-muted)]">{q.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${q.badgeBg} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center`}>{qCards.length}</span>
                      <button onClick={() => isAddingHere ? setAddingIn(null) : openAddCard(q.id)} className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                        {isAddingHere ? <X size={14} /> : <Plus size={14} />}
                      </button>
                    </div>
                  </div>

                  <Droppable droppableId={q.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5 transition-all ${snapshot.isDraggingOver ? 'bg-[var(--primary)]/5 ring-1 ring-inset ring-[var(--primary)]/20' : ''}`}
                      >
                        {qCards.length === 0 && !snapshot.isDraggingOver && !isAddingHere && (
                          <div className="flex flex-col items-center justify-center text-[var(--text-muted)] text-xs italic py-4 gap-1 select-none">
                            <span className="text-xl opacity-30">☐</span>
                            <span>Drag from inbox or click +</span>
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
                                  style={drag.draggableProps.style}
                                  className={`group relative bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--primary)]/40
                                    rounded-lg px-3 py-2.5 cursor-pointer transition-all select-none
                                    ${isCompleted ? 'opacity-50' : ''}
                                    ${dragSnap.isDragging ? 'shadow-xl rotate-1 ring-2 ring-[var(--primary)] z-50 bg-[var(--bg-elevated)]' : ''}`}
                                >
                                  <button onClick={(e) => handleToggleComplete(e, card)} className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 ${isCompleted ? 'bg-[#1F845A] border-[#1F845A] text-white !opacity-100' : 'border-[var(--text-muted)] hover:border-[#1F845A] hover:bg-[#1F845A]/20 text-transparent hover:text-[#1F845A]'}`}>
                                    <Check size={11} strokeWidth={3} />
                                  </button>
                                  <p className={`text-sm text-[var(--text)] font-medium leading-snug pr-6 ${isCompleted ? 'line-through text-[var(--text-muted)]' : ''}`}>{card.title}</p>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border)]">{getListName(card.list_id)}</span>
                                    {card.due_date && <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1"><Clock size={10} />{new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                                    {card.assignee && <span className="ml-auto w-5 h-5 rounded-full bg-[#1F845A] flex items-center justify-center text-white text-[9px] font-bold shrink-0">{card.assignee.substring(0, 2).toUpperCase()}</span>}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {/* Inline add form */}
                        <AnimatePresence>
                          {isAddingHere && (
                            <motion.form
                              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                              onSubmit={(e) => handleAddCard(e, q)}
                              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-2.5 flex flex-col gap-2 mt-1"
                            >
                              <input ref={inputRef} value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Escape' && setAddingIn(null)} placeholder="Card title..." className="input-base text-sm py-1.5" />
                              {lists.length > 1 && (
                                <select value={selectedListId} onChange={e => setSelectedListId(e.target.value)} className="input-base text-sm py-1.5">
                                  {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                                </select>
                              )}
                              <div className="flex gap-2">
                                <button type="submit" disabled={adding || !newTitle.trim()} className="btn btn-primary text-xs px-3 py-1.5 flex-1">{adding ? '...' : 'Add card'}</button>
                                <button type="button" onClick={() => setAddingIn(null)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-muted)] rounded transition-colors"><X size={14} /></button>
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
            <span>Drag cards from the <strong className="text-[var(--text)]">Inbox</strong> into quadrants to classify • Drag back to Inbox to unclassify</span>
          </div>
        </div>

        {/* Inbox Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              key="inbox-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-muted)] shrink-0">
                <div className="flex items-center gap-2">
                  <Inbox size={16} className="text-[var(--primary)]" />
                  <div>
                    <div className="text-sm font-bold text-[var(--text)]">Inbox</div>
                    <div className="text-xs text-[var(--text-muted)]">Unclassified tasks</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAIPlot}
                    disabled={isPlotting || inboxCards.length === 0}
                    title="Auto-plot with AI"
                    className="p-1.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors disabled:opacity-50 disabled:hover:bg-[var(--primary)]/10"
                  >
                    <Wand2 size={13} className={isPlotting ? "animate-pulse" : ""} />
                  </button>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] min-w-[22px] text-center">
                    {inboxCards.length}
                  </span>
                </div>
              </div>

              {/* Quick-add input */}
              <form onSubmit={handleAddToInbox} className="px-3 py-3 border-b border-[var(--border)] shrink-0">
                {lists.length > 1 && (
                  <select value={selectedListId || lists[0]?.id} onChange={e => setSelectedListId(e.target.value)} className="input-base text-xs py-1 mb-2">
                    {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inboxInputRef}
                    value={inboxTitle}
                    onChange={e => setInboxTitle(e.target.value)}
                    placeholder="Add a task to inbox..."
                    className="input-base text-sm py-1.5 flex-1"
                  />
                  <button type="submit" disabled={addingToInbox || !inboxTitle.trim()} className="btn btn-primary px-3 py-1.5 shrink-0">
                    <Plus size={15} />
                  </button>
                </div>
              </form>

              {/* Inbox cards droppable */}
              <Droppable droppableId="inbox">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5 transition-all ${snapshot.isDraggingOver ? 'bg-[var(--primary)]/5' : ''}`}
                  >
                    {inboxCards.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-xs text-center gap-2 py-8 select-none">
                        <Inbox size={32} className="opacity-20" />
                        <p>Add tasks above,<br/>then drag to a quadrant</p>
                      </div>
                    )}

                    {inboxCards.map((card, idx) => {
                      const isCompleted = (card.labels ?? []).includes('done');
                      return (
                        <Draggable key={card.id} draggableId={card.id} index={idx}>
                          {(drag, dragSnap) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              onClick={() => onOpenCard(card.id)}
                              style={drag.draggableProps.style}
                              className={`group relative bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--primary)]/40
                                rounded-lg px-3 py-2.5 cursor-grab transition-all select-none
                                ${isCompleted ? 'opacity-50' : ''}
                                ${dragSnap.isDragging ? 'shadow-xl rotate-2 ring-2 ring-[var(--primary)] z-50 cursor-grabbing' : ''}`}
                            >
                              <button onClick={(e) => handleToggleComplete(e, card)} className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 ${isCompleted ? 'bg-[#1F845A] border-[#1F845A] text-white !opacity-100' : 'border-[var(--text-muted)] hover:border-[#1F845A] hover:bg-[#1F845A]/20 text-transparent hover:text-[#1F845A]'}`}>
                                <Check size={11} strokeWidth={3} />
                              </button>
                              <p className={`text-sm text-[var(--text)] font-medium leading-snug pr-6 ${isCompleted ? 'line-through text-[var(--text-muted)]' : ''}`}>{card.title}</p>
                              <span className="text-[11px] text-[var(--text-muted)] mt-1 block">{getListName(card.list_id)}</span>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Bottom AI Chat Section */}
              <div className="border-t border-[var(--border)] p-3 bg-[var(--bg-muted)] shrink-0">
                <form onSubmit={handleAIExtract} className="flex flex-col gap-2">
                  <div className="relative">
                    <textarea 
                      value={aiText}
                      onChange={e => setAiText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAIExtract();
                        }
                      }}
                      placeholder="Ask AI to create tasks from your thoughts..."
                      className="w-full text-xs p-2.5 pr-8 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)] outline-none focus:border-[var(--primary)] resize-none"
                      rows={2}
                    />
                    <button 
                      type="submit"
                      disabled={isExtracting || !aiText.trim()}
                      className="absolute right-1.5 bottom-1.5 p-1.5 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                       {isExtracting ? <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <Sparkles size={10} className="text-[var(--primary)]" />
                    AI extracts multiple tasks
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          title={sidebarOpen ? "Hide inbox" : "Show inbox"}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-l-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-muted)] transition-colors shadow-md"
          style={{ right: sidebarOpen ? 280 : 0 }}
        >
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={16} />
          </motion.div>
        </button>
      </div>
    </DragDropContext>
  );
}
