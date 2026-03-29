"use client";

import { Card, List } from "@/lib/types";
import { motion } from "framer-motion";
import { Check, AlertTriangle, Clock, Trash2, Calendar } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "./Toast";

type Quadrant = {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  headerColor: string;
  borderColor: string;
  badgeBg: string;
  match: (labels: string[]) => boolean;
};

const QUADRANTS: Quadrant[] = [
  {
    id: "q1", label: "Do First", subtitle: "Urgent & Important",
    icon: <AlertTriangle size={16} className="text-[#EB5A46]" />,
    headerColor: "border-[#EB5A46]", borderColor: "border-[#EB5A46]/40",
    badgeBg: "bg-[#EB5A46]",
    match: (l) => l.includes("urgent") && l.includes("important"),
  },
  {
    id: "q2", label: "Schedule", subtitle: "Not Urgent & Important",
    icon: <Calendar size={16} className="text-[#579dff]" />,
    headerColor: "border-[#579dff]", borderColor: "border-[#579dff]/40",
    badgeBg: "bg-[#579dff]",
    match: (l) => !l.includes("urgent") && l.includes("important"),
  },
  {
    id: "q3", label: "Delegate", subtitle: "Urgent & Not Important",
    icon: <Clock size={16} className="text-[#F5A623]" />,
    headerColor: "border-[#F5A623]", borderColor: "border-[#F5A623]/40",
    badgeBg: "bg-[#F5A623]",
    match: (l) => l.includes("urgent") && !l.includes("important"),
  },
  {
    id: "q4", label: "Eliminate", subtitle: "Not Urgent & Not Important",
    icon: <Trash2 size={16} className="text-[#9fadbc]" />,
    headerColor: "border-[#626F86]", borderColor: "border-[#626F86]/40",
    badgeBg: "bg-[#626F86]",
    match: (l) => !l.includes("urgent") && !l.includes("important"),
  },
];

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
      await db.updateCard(card.id, { completed: !card.completed });
      onRefresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  return (
    <div className="flex-1 p-4 overflow-auto custom-scrollbar relative z-10">
      <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full min-h-0" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {QUADRANTS.map((q, qi) => {
          const qCards = cards.filter(c => q.match(c.labels ?? [])).sort((a, b) => a.position - b.position);
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.07 }}
              className={`bg-[var(--bg-elevated)] border ${q.borderColor} rounded-xl flex flex-col overflow-hidden`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b ${q.headerColor} bg-[var(--bg-muted)]`}>
                <div className="flex items-center gap-2">
                  {q.icon}
                  <div>
                    <div className="text-sm font-bold text-[#E6EDF3]">{q.label}</div>
                    <div className="text-xs text-[#7D8590]">{q.subtitle}</div>
                  </div>
                </div>
                <span className={`${q.badgeBg} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center`}>
                  {qCards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">
                {qCards.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-[#7D8590] text-sm italic py-8">
                    No cards here
                  </div>
                )}
                {qCards.map(card => (
                  <motion.div
                    key={card.id}
                    whileHover={{ y: -1 }}
                    onClick={() => onOpenCard(card.id)}
                    className={`group relative bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--primary)]/40
                      rounded-lg px-3 py-2.5 cursor-pointer transition-all
                      ${card.completed ? 'opacity-50' : ''}`}
                  >
                    {/* Tick button */}
                    <button
                      onClick={(e) => handleToggleComplete(e, card)}
                      title={card.completed ? "Mark incomplete" : "Mark complete"}
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-all
                        ${card.completed
                          ? 'bg-[#1F845A] border-[#1F845A] text-white'
                          : 'border-[#7D8590] hover:border-[#1F845A] hover:bg-[#1F845A]/20 text-transparent hover:text-[#1F845A]'
                        }`}
                    >
                      <Check size={11} strokeWidth={3} />
                    </button>

                    <p className={`text-sm text-[#E6EDF3] font-medium leading-snug pr-6 ${card.completed ? 'line-through text-[#7D8590]' : ''}`}>
                      {card.title}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[11px] text-[#7D8590] bg-[#161B22] px-1.5 py-0.5 rounded">
                        {getListName(card.list_id)}
                      </span>
                      {card.due_date && (
                        <span className="text-[11px] text-[#7D8590] flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {card.assignee && (
                        <span className="ml-auto w-5 h-5 rounded-full bg-[#1F845A] flex items-center justify-center text-white text-[9px] font-bold">
                          {card.assignee.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-[#7D8590]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EB5A46] inline-block"/>Add labels <code className="bg-[#21262D] px-1 rounded text-[#E6EDF3]">urgent</code> + <code className="bg-[#21262D] px-1 rounded text-[#E6EDF3]">important</code> in the card editor</span>
      </div>
    </div>
  );
}
