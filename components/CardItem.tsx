"use client";

import { Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card } from "@/lib/types";
import { db } from "@/lib/db";
import { useToast } from "./Toast";

const LABEL_COLORS: Record<string, string> = {
  red: '#eb5a46', orange: '#ff9f1a', yellow: '#f2d600',
  green: '#61bd4f', blue: '#0079bf', purple: '#c377e0',
  urgent: '#ff9f1a', important: '#579dff',
};

// Labels that should NOT show as colored pills (functional labels)
const FUNCTIONAL_LABELS = new Set(['done', 'urgent', 'important']);

export function CardItem({ card, index, onClick, onRefresh }: { card: Card, index: number, onClick: () => void, onRefresh?: () => void }) {
  const { labels, title, due_date, checklist, assignee } = card;
  const toast = useToast();

  // Derive completion from labels — no DB column needed
  const completed = labels?.includes('done') ?? false;

  const firstVisualLabel = labels?.find(l => LABEL_COLORS[l] && !FUNCTIONAL_LABELS.has(l));
  const firstLabelColor = firstVisualLabel ? LABEL_COLORS[firstVisualLabel] : undefined;

  const checklistTotal = checklist?.length || 0;
  const checklistDone = checklist?.filter(item => item.done).length || 0;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const currentLabels = labels ?? [];
      const newLabels = completed
        ? currentLabels.filter(l => l !== 'done')       // remove done
        : [...currentLabels, 'done'];                   // add done
      await db.updateCard(card.id, { labels: newLabels });
      onRefresh?.();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group relative bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)] rounded-lg p-[8px_12px] mb-2 cursor-pointer
            shadow-[var(--shadow-sm)]
            hover:shadow-[var(--shadow-md)]
            ring-inset hover:ring-1 hover:ring-[var(--primary)]/20
            transition-colors duration-100 border-l-[3px]
            ${completed ? 'opacity-60' : ''}
            ${snapshot.isDragging ? 'opacity-90 rotate-3 shadow-2xl ring-2 ring-[var(--primary)] z-50' : 'ring-0'}
          `}
          style={{ ...provided.draggableProps.style, borderLeftColor: firstLabelColor ?? 'transparent' }}
        >
          {/* Hover tick button */}
          <motion.button
            initial={false}
            onClick={handleToggleComplete}
            title={completed ? "Mark as incomplete" : "Mark as complete"}
            className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-all duration-150 z-10
              ${completed
                ? 'bg-[#1F845A] border-[#1F845A] text-white opacity-100'
                : 'border-[#9fadbc] hover:border-[#1F845A] hover:bg-[#1F845A]/20 text-transparent hover:text-[#1F845A]'
              }`}
          >
            <Check size={11} strokeWidth={3} />
          </motion.button>

          {/* Visual label pills — skip functional labels */}
          {labels && labels.filter(l => LABEL_COLORS[l] && !FUNCTIONAL_LABELS.has(l)).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5 mt-0.5 pr-6">
              {labels.filter(l => LABEL_COLORS[l] && !FUNCTIONAL_LABELS.has(l)).map(l => (
                <div key={l} className="h-2 rounded-[3px] min-w-[40px] px-2" style={{ backgroundColor: LABEL_COLORS[l] }} />
              ))}
            </div>
          )}

          {/* Urgent/Important badges */}
          {(labels?.includes('urgent') || labels?.includes('important')) && (
            <div className="flex gap-1 mb-1.5 flex-wrap pr-6">
              {labels.includes('urgent') && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#ff9f1a]/20 text-[#ff9f1a]">URGENT</span>
              )}
              {labels.includes('important') && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#579dff]/20 text-[#579dff]">IMPORTANT</span>
              )}
            </div>
          )}

          <div className={`text-[14px] text-[var(--text)] font-normal leading-[20px] break-words mb-1 pr-6 ${completed ? 'line-through text-[var(--text-muted)]' : ''}`}>
            {title}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[12px] text-[#9fadbc] mt-1.5">
            {due_date && <DueDateBadge date={due_date} completed={completed} />}

            {checklistTotal > 0 && (
              <div className={`flex items-center gap-1 rounded-sm px-1.5 py-0.5 ${checklistDone === checklistTotal ? 'bg-[#1F845A] text-white' : ''}`}>
                <Check size={11} strokeWidth={3} />
                <span className="text-xs">{checklistDone}/{checklistTotal}</span>
              </div>
            )}

            {assignee && (
              <div className="ml-auto w-6 h-6 rounded-full bg-gradient-to-br from-[#1F845A] to-[#125B3E] flex items-center justify-center font-bold text-white text-[10px]" title={assignee}>
                {assignee.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function DueDateBadge({ date, completed }: { date: string, completed: boolean }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(date); due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let colorClass = 'hover:bg-[#A6C5E2]/[0.16] rounded-sm px-1.5 py-0.5';
  if (completed) colorClass = 'bg-[#1F845A] rounded-sm px-1.5 py-0.5 text-white font-medium';
  else if (diff < 0) colorClass = 'bg-[#CA3521] rounded-sm px-1.5 py-0.5 text-white font-medium';
  else if (diff === 0) colorClass = 'bg-[#B26E17] rounded-sm px-1.5 py-0.5 text-white font-medium';

  return (
    <div className={`flex items-center gap-1 ${colorClass} transition-colors text-xs`}>
      <span>⏰</span>
      {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
    </div>
  );
}
