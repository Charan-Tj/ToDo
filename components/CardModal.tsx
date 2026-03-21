"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "@/components/Toast";
import { Card } from "@/lib/types";

const LABEL_COLORS: Record<string, string> = {
  red: '#eb5a46', orange: '#ff9f1a', yellow: '#f2d600',
  green: '#61bd4f', blue: '#0079bf', purple: '#c377e0'
};

export function CardModal({ card, onClose, onRefresh }: { card: Card, boardId?: string, onClose: () => void, onRefresh: () => void }) {
  const toast = useToast();
  const [desc, setDesc] = useState(card.description || "");
  const [chkInput, setChkInput] = useState("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const updateField = async (field: keyof Card, val: unknown) => {
    try { await db.updateCard(card.id, { [field]: val }); onRefresh(); }
    catch(e) { toast((e as Error).message, 'error'); }
  };

  const handleLabelToggle = (l: string) => {
    const labels = card.labels || [];
    const newLabels = labels.includes(l) ? labels.filter(x => x !== l) : [...labels, l];
    updateField('labels', newLabels);
  };

  const toggleCheck = (idx: number, done: boolean) => {
    const clone = [...(card.checklist||[])];
    clone[idx].done = done;
    updateField('checklist', clone);
  };

  const addCheckItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter' && chkInput.trim()) {
      const clone = [...(card.checklist||[]), { text: chkInput.trim(), done: false }];
      updateField('checklist', clone);
      setChkInput("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto pt-12"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#f5f6f8] dark:bg-[#282E33] w-full max-w-[720px] rounded-xl min-h-[540px] shadow-2xl my-auto relative transition-colors"
      >
        <button onClick={onClose} className="absolute right-3 top-3 text-[#44546f] dark:text-[#9fadbc] hover:text-[#172b4d] dark:hover:text-white hover:bg-[#091e4214] dark:hover:bg-[#A6C5E2]/[0.16] rounded-lg p-2 transition-colors z-10">
          <X size={20}/>
        </button>

        <div className="p-6 flex flex-col gap-5">
          <input
            className="text-xl font-semibold bg-transparent text-[#172b4d] dark:text-white border-none outline-none focus:bg-white dark:focus:bg-[#22272B] focus:shadow-[0_0_0_2px_#0c66e4] dark:focus:shadow-[0_0_0_2px_#579dff] rounded-lg px-3 py-2 -ml-3 transition-all"
            defaultValue={card.title}
            onBlur={e => e.target.value.trim() && updateField('title', e.target.value.trim())}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-semibold text-[#44546f] dark:text-[#9fadbc] mb-2 uppercase tracking-wide">Description</h3>
                <textarea
                  className="w-full bg-white dark:bg-[#22272B] hover:bg-[#fafbfc] dark:hover:bg-[#2C333A] focus:bg-white dark:focus:bg-[#22272B] border border-[#091e4214] dark:border-[#A6C5E2]/10 focus:border-[#0c66e4] dark:focus:border-[#579dff] rounded-lg p-3 text-sm text-[#172b4d] dark:text-[#B6C2CF] outline-none min-h-[100px] resize-y transition-all shadow-sm"
                  placeholder="Add a more detailed description..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  onBlur={() => updateField('description', desc)}
                />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#44546f] dark:text-[#9fadbc] mb-2 uppercase tracking-wide">Checklist</h3>
                <div className="flex flex-col gap-2">
                  {card.checklist?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white dark:bg-[#22272B] p-2 rounded-lg shadow-sm hover:shadow group">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={e => toggleCheck(idx, e.target.checked)}
                        className="w-4 h-4 rounded border-2 border-[#091e4224] dark:border-[#A6C5E2]/10 text-[#0c66e4] dark:text-[#579dff] focus:ring-[#0c66e4] dark:focus:ring-[#579dff] focus:ring-2 cursor-pointer"
                      />
                      <span className={`text-sm flex-1 ${item.done ? 'line-through text-[#44546f] dark:text-[#9fadbc]' : 'text-[#172b4d] dark:text-[#B6C2CF]'}`}>{item.text}</span>
                      <button
                        onClick={() => {
                          const clone = [...card.checklist]; clone.splice(idx,1); updateField('checklist', clone);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[#44546f] dark:text-[#9fadbc] hover:text-red-600 transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <input
                    className="mt-1 text-sm p-2.5 bg-white dark:bg-[#22272B] border border-[#091e4214] dark:border-[#A6C5E2]/10 rounded-lg hover:border-[#091e4224] dark:hover:border-[#A6C5E2]/15 focus:border-[#0c66e4] dark:focus:border-[#579dff] focus:bg-white dark:focus:bg-[#22272B] outline-none shadow-sm transition-all text-[#172b4d] dark:text-[#B6C2CF] placeholder-[#44546f] dark:placeholder-[#9fadbc]"
                    placeholder="Add an item..."
                    value={chkInput}
                    onChange={e=>setChkInput(e.target.value)}
                    onKeyDown={addCheckItem}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-semibold text-[#44546f] dark:text-[#9fadbc] mb-2 uppercase tracking-wide">Labels</h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(LABEL_COLORS).map(([name, color]) => {
                    const has = card.labels?.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => handleLabelToggle(name)}
                        className="h-8 rounded-md flex items-center justify-center transition-all hover:scale-105 shadow-sm"
                        style={{ backgroundColor: color, opacity: has ? 1 : 0.4 }}
                      >
                        {has && <Check size={14} className="text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#44546f] dark:text-[#9fadbc] mb-2 uppercase tracking-wide">Due Date</h3>
                <input
                  type="date"
                  className="w-full rounded-lg p-2 text-sm border border-[#091e4214] dark:border-[#A6C5E2]/10 bg-white dark:bg-[#22272B] hover:border-[#091e4224] dark:hover:border-[#A6C5E2]/15 focus:bg-white dark:focus:bg-[#22272B] focus:border-[#0c66e4] dark:focus:border-[#579dff] outline-none shadow-sm transition-all text-[#172b4d] dark:text-[#B6C2CF]"
                  defaultValue={card.due_date || ""}
                  onChange={e => updateField('due_date', e.target.value || null)}
                />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#44546f] dark:text-[#9fadbc] mb-2 uppercase tracking-wide">Member</h3>
                <input
                  type="text"
                  placeholder="Assign to..."
                  className="w-full rounded-lg p-2 text-sm border border-[#091e4214] dark:border-[#A6C5E2]/10 bg-white dark:bg-[#22272B] hover:border-[#091e4224] dark:hover:border-[#A6C5E2]/15 focus:bg-white dark:focus:bg-[#22272B] focus:border-[#0c66e4] dark:focus:border-[#579dff] outline-none shadow-sm transition-all text-[#172b4d] dark:text-[#B6C2CF] placeholder-[#44546f] dark:placeholder-[#9fadbc]"
                  defaultValue={card.assignee || ""}
                  onBlur={e => updateField('assignee', e.target.value.trim())}
                />
              </div>

              <div className="mt-auto pt-4 border-t border-[#091e4214] dark:border-[#A6C5E2]/10">
                <button
                  onClick={async () => {
                    if(confirm('Delete this card?')) {
                      await db.deleteCard(card.id);
                      onRefresh();
                      onClose();
                    }
                  }}
                  className="w-full text-center py-2 bg-white dark:bg-[#22272B] text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-medium border border-red-200 dark:border-red-800 hover:border-red-600 shadow-sm"
                >
                  Delete Card
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
