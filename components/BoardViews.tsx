"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Table, Calendar, BarChart3, ChartGantt, MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";

export type ViewType = "board" | "table" | "calendar" | "dashboard" | "timeline" | "map";

const VIEWS = [
  { id: "board", name: "Board", icon: LayoutGrid, description: "Organize cards in lists" },
  { id: "table", name: "Table", icon: Table, description: "Spreadsheet view of all cards" },
  { id: "calendar", name: "Calendar", icon: Calendar, description: "View cards by due date" },
  { id: "dashboard", name: "Dashboard", icon: BarChart3, description: "Charts and metrics" },
  { id: "timeline", name: "Timeline", icon: ChartGantt, description: "Gantt chart view" },
  { id: "map", name: "Map", icon: MapPin, description: "Location-based view" },
] as const;

export function BoardViews({ currentView, onViewChange }: { currentView: ViewType, onViewChange: (view: ViewType) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const currentViewData = VIEWS.find(v => v.id === currentView)!;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-[10px] transition-colors border border-white/15"
      >
        <currentViewData.icon size={16} />
        <span>{currentViewData.name}</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.1 }}
            className="absolute top-11 left-0 w-[280px] app-panel z-50 py-2"
          >
            <div className="px-3 py-2 border-b border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Views</p>
            </div>

            {VIEWS.map(view => {
              const Icon = view.icon;
              const isActive = view.id === currentView;

              return (
                <button
                  key={view.id}
                  onClick={() => {
                    onViewChange(view.id as ViewType);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-[var(--bg-muted)] transition-colors flex items-center gap-3 ${
                    isActive ? 'bg-[color:var(--ring)]/30' : ''
                  }`}
                >
                  <Icon size={16} className={`${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                      {view.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {view.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-[var(--primary)] rounded-full" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}