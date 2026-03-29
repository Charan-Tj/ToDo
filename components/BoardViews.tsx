"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Table2, LayoutPanelTop, ChevronDown } from "lucide-react";
import { useState } from "react";

export type ViewType = "board" | "table" | "matrix";

const VIEWS = [
  { id: "board", name: "Board", icon: LayoutGrid, description: "Organize cards in lists" },
  { id: "table", name: "Table", icon: Table2, description: "Spreadsheet view of all cards" },
  { id: "matrix", name: "Matrix", icon: LayoutPanelTop, description: "Eisenhower priority quadrants" },
] as const;

export function BoardViews({ currentView, onViewChange }: { currentView: ViewType, onViewChange: (view: ViewType) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentViewData = VIEWS.find(v => v.id === currentView) ?? VIEWS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/15"
      >
        <currentViewData.icon size={15} />
        <span>{currentViewData.name}</span>
        <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.1 }}
              className="absolute top-10 right-0 w-[240px] bg-[#282E33] border border-[#A6C5E2]/[0.16] rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
            >
              <p className="text-[11px] font-bold text-[#9fadbc] uppercase tracking-wider px-3 pt-2 pb-1">Views</p>
              {VIEWS.map(view => {
                const Icon = view.icon;
                const isActive = view.id === currentView;
                return (
                  <button
                    key={view.id}
                    onClick={() => { onViewChange(view.id as ViewType); setIsOpen(false); }}
                    className={`w-full px-3 py-2.5 text-left hover:bg-[#A6C5E2]/[0.1] transition-colors flex items-center gap-3 ${isActive ? 'bg-[#579dff]/10' : ''}`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#579dff]' : 'text-[#9fadbc]'} />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${isActive ? 'text-[#579dff]' : 'text-[#B6C2CF]'}`}>{view.name}</div>
                      <div className="text-xs text-[#9fadbc]">{view.description}</div>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 bg-[#579dff] rounded-full" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}