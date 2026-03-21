"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Card } from "@/lib/types";
import { Clock, CheckSquare } from "lucide-react";

const LABEL_COLORS: Record<string, string> = {
  red: '#eb5a46', orange: '#ff9f1a', yellow: '#f2d600',
  green: '#61bd4f', blue: '#3f7a73', purple: '#c377e0'
};

export function CardItem({ card, index, onClick }: { card: Card, index: number, onClick: () => void }) {
  const { labels, title, due_date, checklist, assignee } = card;

  const checklistTotal = checklist?.length || 0;
  const checklistDone = checklist?.filter(item => item.done).length || 0;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)] rounded-[12px] p-2.5 mb-2 cursor-pointer
            border border-[var(--border)] shadow-[0_2px_8px_rgba(16,34,58,0.08)]
            hover:shadow-[0_10px_22px_rgba(16,34,58,0.18)]
            transition-all duration-75
            ${snapshot.isDragging ? 'rotate-2 shadow-[0_16px_30px_rgba(9,30,66,0.3)] ring-2 ring-[var(--primary)] z-50' : ''}
          `}
          style={provided.draggableProps.style}
        >
          {labels && labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {labels.map(l => (
                <div
                  key={l}
                  className="h-2 rounded-sm min-w-[40px]"
                  style={{ backgroundColor: LABEL_COLORS[l] }}
                />
              ))}
            </div>
          )}

          <div className="text-[14px] text-[var(--text)] font-medium leading-5 break-words mb-1.5">
            {title}
          </div>

          {(due_date || checklistTotal > 0 || assignee) && (
            <div className="flex items-center gap-2 flex-wrap text-[12px] text-[var(--text-muted)] mt-1">
              {due_date && (
                <DueDateBadge date={due_date} />
              )}

              {checklistTotal > 0 && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${checklistDone === checklistTotal ? 'bg-[var(--success)] text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}>
                  <CheckSquare size={12} />
                  <span className="text-xs font-medium">{checklistDone}/{checklistTotal}</span>
                </div>
              )}

              {assignee && (
                <div className="ml-auto w-6 h-6 rounded-full bg-gradient-to-br from-[#4bce97] to-[#1f845a] flex items-center justify-center font-semibold text-white text-[10px] shadow-sm" title={assignee}>
                  {assignee.substring(0,2).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function DueDateBadge({ date }: { date: string }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(date); due.setHours(0,0,0,0);
  const diff = Math.round((due.getTime() - today.getTime())/(1000*60*60*24));

  let bgClass = 'hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16]';
  let textClass = 'text-[#44546f] dark:text-[#9fadbc]';
  if (diff < 0) {
    bgClass = 'bg-[#f87168]';
    textClass = 'text-white font-medium';
  } else if (diff === 0) {
    bgClass = 'bg-[#f5cd47]';
    textClass = 'text-[#172b4d] font-medium';
  }

  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm ${bgClass} ${textClass} transition-colors`}>
      <Clock size={12} />
      <span className="text-xs">{due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
    </div>
  );
}
