"use client";

import { Card, List } from "@/lib/types";
import { Calendar, Clock, CheckSquare, User, Tag, Archive } from "lucide-react";

const LABEL_COLORS: Record<string, string> = {
  red: '#eb5a46', orange: '#ff9f1a', yellow: '#f2d600',
  green: '#61bd4f', blue: '#0079bf', purple: '#c377e0'
};

export function TableView({ cards, lists, onOpenCard }: { cards: Card[], lists: List[], onOpenCard: (id: string) => void }) {
  const getListName = (listId: string) => lists.find(l => l.id === listId)?.title || "Unknown";

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDueDateStatus = (dateStr: string) => {
    if (!dateStr) return "";
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dateStr); due.setHours(0,0,0,0);
    const diff = Math.round((due.getTime() - today.getTime())/(1000*60*60*24));

    if (diff < 0) return "overdue";
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    return "";
  };

  return (
    <div className="flex-1 transition-colors overflow-hidden flex flex-col app-surface rounded-none border-x-0 border-b-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
        <h2 className="text-lg font-semibold text-[var(--text)]">Table View</h2>
        <div className="text-sm text-[var(--text-muted)]">
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-[var(--bg-muted)] sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Archive size={14} />
                  Card
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border)] w-48">
                <div className="flex items-center gap-2">
                  <Archive size={14} />
                  List
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border)] w-32">
                <div className="flex items-center gap-2">
                  <Tag size={14} />
                  Labels
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border)] w-32">
                <div className="flex items-center gap-2">
                  <User size={14} />
                  Members
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border)] w-40">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  Due Date
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border)] w-32">
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} />
                  Checklist
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  No cards to display
                </td>
              </tr>
            ) : (
              cards.map(card => {
                const checklistTotal = card.checklist?.length || 0;
                const checklistDone = card.checklist?.filter(item => item.done).length || 0;
                const dueDateStatus = getDueDateStatus(card.due_date || "");

                return (
                  <tr
                    key={card.id}
                    onClick={() => onOpenCard(card.id)}
                    className="hover:bg-[var(--bg-muted)] cursor-pointer transition-colors border-b border-[var(--border)]"
                  >
                    {/* Card Name */}
                    <td className="px-4 py-3 text-sm text-[var(--text)]">
                      <div className="font-medium">{card.title}</div>
                      {card.description && (
                        <div className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                          {card.description.substring(0, 100)}...
                        </div>
                      )}
                    </td>

                    {/* List */}
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-[var(--bg-muted)] rounded-full">
                        {getListName(card.list_id)}
                      </span>
                    </td>

                    {/* Labels */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {card.labels?.slice(0, 3).map(label => (
                          <div
                            key={label}
                            className="w-6 h-2 rounded-sm"
                            style={{ backgroundColor: LABEL_COLORS[label] }}
                            title={label}
                          />
                        ))}
                        {(card.labels?.length || 0) > 3 && (
                          <span className="text-xs text-[var(--text-muted)]">+{(card.labels?.length || 0) - 3}</span>
                        )}
                      </div>
                    </td>

                    {/* Members */}
                    <td className="px-4 py-3">
                      {card.assignee && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4bce97] to-[#1f845a] flex items-center justify-center font-semibold text-white text-[10px] shadow-sm" title={card.assignee}>
                          {card.assignee.substring(0,2).toUpperCase()}
                        </div>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3">
                      {card.due_date && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-sm ${
                          dueDateStatus === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : dueDateStatus === 'today'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                        }`}>
                          <Clock size={12} />
                          {formatDate(card.due_date)}
                        </div>
                      )}
                    </td>

                    {/* Checklist */}
                    <td className="px-4 py-3">
                      {checklistTotal > 0 && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-sm ${
                          checklistDone === checklistTotal
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                        }`}>
                          <CheckSquare size={12} />
                          {checklistDone}/{checklistTotal}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}