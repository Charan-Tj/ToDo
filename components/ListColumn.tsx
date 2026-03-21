"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Droppable } from "@hello-pangea/dnd";
import { List, Card } from "@/lib/types";
import { CardItem } from "./CardItem";
import { db } from "@/lib/db";
import { useToast } from "./Toast";
import { Plus, MoreHorizontal, X, Trash2, Minus, Copy, Move, Eye, Palette, Zap, Calendar, Clock, Archive } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const LIST_COLORS = [
  { name: 'None', value: '#ebecf0' },
  { name: 'Green', value: '#4bce97' },
  { name: 'Yellow', value: '#f5cd47' },
  { name: 'Orange', value: '#faa53d' },
  { name: 'Red', value: '#f87168' },
  { name: 'Purple', value: '#9f8fef' },
  { name: 'Blue', value: '#579dff' },
  { name: 'Sky', value: '#6cc3e0' },
  { name: 'Lime', value: '#94c748' },
  { name: 'Pink', value: '#e774bb' },
  { name: 'Black', value: '#8590a2' },
];

export function ListColumn({ list, cards, onRefresh, onOpenCard }: { list: List, cards: Card[], onRefresh: () => void, onOpenCard: (id: string) => void }) {
  const toast = useToast();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [listColor, setListColor] = useState(list.bg_color || '#ebecf0');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
      }
    };
    if (showMenu || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu, showColorPicker]);

  const handleUpdateTitle = async (val: string) => {
    if (!val.trim() || val.trim() === list.title) return;
    try {
      await db.updateListTitle(list.id, val.trim());
      onRefresh();
    } catch(e) { toast((e as Error).message, 'error'); }
  };

  const handleAddCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    const pos = cards.length > 0 ? cards[cards.length - 1].position + 1000 : 1000;
    try {
      await db.createCard(list.id, newCardTitle.trim(), pos);
      setNewCardTitle("");
      setIsAddingCard(false);
      onRefresh();
    } catch(e) { toast((e as Error).message, 'error'); }
  };

  const handleDeleteList = async () => {
    if (!confirm('Delete this list and all its cards?')) return;
    try {
      await db.deleteList(list.id);
      onRefresh();
      setShowMenu(false);
    } catch(e) { toast((e as Error).message, 'error'); }
  };

  const handleCopyList = async () => {
    try {
      const newTitle = prompt("List name:", `${list.title} (copy)`);
      if (!newTitle?.trim()) return;

      // This would normally create a copy with all cards
      const pos = 999999; // Position at end
      await db.createList(list.board_id, newTitle.trim(), pos);
      onRefresh();
      setShowMenu(false);
      toast("List copied successfully", "success");
    } catch(e) { toast((e as Error).message, 'error'); }
  };

  const handleChangeColor = async (color: string) => {
    try {
      await db.updateListColor(list.id, color);
      setListColor(color);
      onRefresh();
      setShowColorPicker(false);
      setShowMenu(false);
    } catch(e) { toast((e as Error).message, 'error'); }
  };

  const handleArchiveList = async () => {
    if (!confirm('Archive this list? You can find it in the board menu.')) return;
    try {
      await db.archiveList(list.id);
      onRefresh();
      setShowMenu(false);
      toast("List archived", "success");
    } catch(e) { toast((e as Error).message, 'error'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="w-[272px] shrink-0 rounded-xl flex flex-col max-h-[100%] whitespace-normal shadow-sm transition-colors"
      style={{ backgroundColor: listColor }}
    >
      <div className="pl-3 pr-2 pt-2 pb-1 flex items-center justify-between group relative">
        <input
          className="flex-1 font-semibold text-[#172b4d] dark:text-[#B6C2CF] text-[14px] bg-transparent outline-none cursor-pointer focus:cursor-text focus:bg-white dark:focus:bg-[#22272B] focus:shadow-[0_0_0_2px_#0c66e4] dark:focus:shadow-[inset_0_0_0_2px_#579dff] rounded px-2 py-1 -ml-2 transition-all"
          defaultValue={list.title}
          onBlur={e => handleUpdateTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <div className="flex items-center gap-1 pl-1 relative">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-[#44546f] dark:text-[#9fadbc] hover:bg-[#091e4224] dark:hover:bg-[#A6C5E2]/[0.16] hover:text-[#172b4d] dark:hover:text-[#B6C2CF] rounded transition-colors"
            title={isCollapsed ? "Expand list" : "Collapse list"}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-[#44546f] dark:text-[#9fadbc] hover:bg-[#091e4224] dark:hover:bg-[#A6C5E2]/[0.16] hover:text-[#172b4d] dark:hover:text-[#B6C2CF] rounded transition-colors"
            title="List actions"
          >
            <MoreHorizontal size={16} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-8 w-[304px] bg-white dark:bg-[#282E33] rounded-lg shadow-[0_8px_16px_-4px_rgba(9,30,66,0.25)] border border-[#091e4214] dark:border-[#A6C5E2]/10 z-50 py-2"
              >
                <div className="px-3 py-2 border-b border-[#091e4214] dark:border-[#A6C5E2]/10">
                  <p className="text-xs text-[#44546f] dark:text-[#B6C2CF] text-center font-medium">List actions</p>
                </div>

                <button
                  onClick={() => setIsAddingCard(true)}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Plus size={16} />
                  <span>Add card</span>
                </button>

                <button
                  onClick={handleCopyList}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Copy size={16} />
                  <span>Copy list</span>
                </button>

                <button
                  onClick={() => toast("Move list feature coming soon!", "info")}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Move size={16} />
                  <span>Move list</span>
                </button>

                <button
                  onClick={() => toast("Watch feature coming soon!", "info")}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Eye size={16} />
                  <span>Watch</span>
                </button>

                <div className="border-t border-[#091e4214] dark:border-[#A6C5E2]/10 my-1" />

                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Palette size={16} />
                  <span>Change list color</span>
                </button>

                {showColorPicker && (
                  <div className="px-3 py-2">
                    <div className="grid grid-cols-4 gap-2">
                      {LIST_COLORS.map(color => (
                        <button
                          key={color.name}
                          onClick={() => handleChangeColor(color.value)}
                          className="w-full h-8 rounded-md hover:scale-105 transition-transform shadow-sm border border-black/10"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {listColor === color.value && (
                            <div className="text-white text-sm font-bold">✓</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-[#091e4214] dark:border-[#A6C5E2]/10 my-1" />

                <div className="px-3 py-1">
                  <p className="text-xs font-semibold text-[#44546f] dark:text-[#9fadbc] mb-1">AUTOMATION</p>
                </div>

                <button
                  onClick={() => toast("Automation rules coming soon!", "info")}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Zap size={16} />
                  <span>When a card is added to this list...</span>
                </button>

                <button
                  onClick={() => toast("Daily sorting coming soon!", "info")}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Calendar size={16} />
                  <span>Every day, sort list by...</span>
                </button>

                <button
                  onClick={() => toast("Weekly sorting coming soon!", "info")}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Clock size={16} />
                  <span>Every Monday, sort list by...</span>
                </button>

                <button
                  onClick={() => toast("Create rule feature coming soon!", "info")}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Plus size={16} />
                  <span>Create a rule</span>
                </button>

                <div className="border-t border-[#091e4214] dark:border-[#A6C5E2]/10 my-1" />

                <button
                  onClick={handleArchiveList}
                  className="w-full px-3 py-2 text-left text-sm text-[#172b4d] dark:text-[#B6C2CF] hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors flex items-center gap-3"
                >
                  <Archive size={16} />
                  <span>Archive this list</span>
                </button>

                <button
                  onClick={handleDeleteList}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                >
                  <Trash2 size={16} />
                  <span>Delete list</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <Droppable droppableId={list.id} type="card">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`px-2 py-0.5 flex-1 overflow-y-auto overflow-x-hidden min-h-[10px] custom-scrollbar transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-black/5 dark:bg-white/5' : ''}`}
              >
                {cards.map((card, index) => (
                  <CardItem key={card.id} card={card} index={index} onClick={() => onOpenCard(card.id)} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {isAddingCard ? (
            <form onSubmit={handleAddCardSubmit} className="px-2 pb-2 mt-1">
              <textarea
                autoFocus
                value={newCardTitle}
                onChange={e => setNewCardTitle(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCardSubmit(e); } if (e.key === 'Escape') setIsAddingCard(false); }}
                placeholder="Enter a title for this card..."
                className="w-full bg-white dark:bg-[#22272B] text-[#172b4d] dark:text-[#B6C2CF] placeholder-[#44546f] dark:placeholder-[#9fadbc] text-sm p-2 rounded-lg outline-none border-0 shadow-[0_0_0_2px_#0c66e4] dark:shadow-[inset_0_0_0_2px_#579dff] resize-none min-h-[72px]"
              />
              <div className="flex items-center gap-2 mt-2">
                <button type="submit" className="bg-[#0c66e4] dark:bg-[#579dff] text-white dark:text-[#1d2125] font-medium text-sm px-3 py-1.5 rounded-md hover:bg-[#0055cc] dark:hover:bg-[#85b8ff] transition-colors shadow-sm">Add card</button>
                <button type="button" onClick={() => setIsAddingCard(false)} className="text-[#44546f] dark:text-[#9fadbc] hover:text-[#172b4d] dark:hover:text-[#B6C2CF] p-1.5 rounded hover:bg-[#091e4224] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors"><X size={20} /></button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCard(true)}
              className="mx-2 mb-2 py-1.5 px-2 text-[#44546f] dark:text-[#B6C2CF] font-normal text-[14px] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[#172b4d] dark:hover:text-white rounded-lg flex items-center gap-1.5 transition-all mt-1"
            >
              <Plus size={16} />
              Add a card
            </button>
          )}
        </>
      )}

      {isCollapsed && (
        <div className="px-3 pb-2 text-[#44546f] dark:text-[#9fadbc] text-sm">
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
        </div>
      )}
    </motion.div>
  );
}