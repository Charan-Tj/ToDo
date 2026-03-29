"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Clock, Lock, Users, X } from "lucide-react";
import { useBoards } from "@/hooks/useBoards";
import { db } from "@/lib/db";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

const BOARD_COLORS = ['#0079BF', '#D29034', '#519839', '#B04632', '#89609E', '#CD5A91'];

export default function DashboardPage() {
  const { boards, loading, refresh } = useBoards();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardColor, setNewBoardColor] = useState(BOARD_COLORS[0]);
  const [newBoardVisibility, setNewBoardVisibility] = useState<'team' | 'personal'>('team');
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState("");
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUserId(data.session.user.id);
    });
  }, []);

  const teamBoards = boards.filter(b => b.visibility !== 'personal');
  const personalBoards = boards.filter(b => b.visibility === 'personal');

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    setCreating(true);
    try {
      await db.createBoard(newBoardName.trim(), newBoardColor, userId, newBoardVisibility);
      setIsModalOpen(false);
      setNewBoardName("");
      setNewBoardVisibility('team');
      refresh();
      toast("Board created", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this board and all its data?")) return;
    try {
      await db.deleteBoard(id);
      refresh();
      toast("Board deleted");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const BoardCard = ({ board }: { board: typeof boards[0] }) => (
    <motion.div
      variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/board/${board.id}`)}
      className="relative rounded-xl cursor-pointer overflow-hidden group shadow-sm hover:shadow-lg transition-all h-24"
      style={{ backgroundColor: board.bg_color }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      {board.visibility === 'personal' && (
        <div className="absolute top-2 left-2 z-10">
          <Lock size={12} className="text-white/80" />
        </div>
      )}
      <h3 className="relative z-10 text-white font-bold text-[15px] p-3 leading-snug drop-shadow-md">
        {board.name}
      </h3>
      <button
        onClick={(e) => handleDelete(e, board.id)}
        className="absolute bottom-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-black/40 rounded text-white/80 hover:text-white transition-all z-20"
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  );

  const BoardSection = ({ title, icon, items }: { title: string, icon: React.ReactNode, items: typeof boards }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
      >
        {items.map(b => <BoardCard key={b.id} board={b} />)}
        {title === 'Team Boards' && (
          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setIsModalOpen(true)}
            className="h-24 rounded-xl cursor-pointer bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-[#9fadbc] hover:text-[#B6C2CF] transition-colors font-medium text-sm border border-white/[0.1]"
          >
            + Create board
          </motion.div>
        )}
        {title === 'My Boards' && items.length === 0 && (
           <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
            whileHover={{ scale: 1.02 }}
            onClick={() => { setNewBoardVisibility('personal'); setIsModalOpen(true); }}
            className="h-24 rounded-xl cursor-pointer bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-[#9fadbc] hover:text-[#B6C2CF] transition-colors font-medium text-sm border border-white/[0.1]"
          >
            + Create private board
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#1d2125] p-6 overflow-y-auto w-full custom-scrollbar text-[#B6C2CF]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#579dff] to-[#0052CC] flex items-center justify-center shadow-lg font-bold text-white text-lg">T</div>
          <div>
            <h1 className="text-xl font-bold text-white">CopyFlow Workspace</h1>
            <p className="text-xs text-[#9fadbc]">Your team&apos;s boards</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { setNewBoardVisibility('personal'); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white/[0.1] hover:bg-white/[0.16] text-white rounded-lg transition-colors border border-white/[0.12]"
            >
              <Lock size={14} /> New private board
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center pt-20"><LoadingSpinner color="border-[#579dff]" size="lg" /></div>
        ) : (
          <>
            <BoardSection title="Team Boards" icon={<Users size={18} className="text-[#9fadbc]" />} items={teamBoards} />
            <BoardSection title="My Boards" icon={<Lock size={18} className="text-[#9fadbc]" />} items={personalBoards} />
          </>
        )}
      </div>

      {/* Recently viewed hint */}
      <div className="max-w-5xl mx-auto mt-2 flex items-center gap-2 text-xs text-[#626F86]">
        <Clock size={12} />
        <span>Click any board to open it. Board data is synced in real-time via Supabase.</span>
      </div>

      {/* Create Board Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#282E33] rounded-xl p-5 w-full max-w-[340px] shadow-2xl border border-[#A6C5E2]/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#B6C2CF]">Create board</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#9fadbc] hover:text-white p-1 rounded transition-colors"><X size={16} /></button>
              </div>
              <form onSubmit={handleCreateBoard}>
                <label className="block text-xs font-bold text-[#9fadbc] mb-1">Board title <span className="text-red-400">*</span></label>
                <input
                  type="text" value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  className="w-full bg-[#22272B] text-white border-2 border-[#579dff] text-sm rounded-lg px-3 py-2 focus:outline-none mb-4"
                  required autoFocus
                />

                {/* Visibility toggle */}
                <label className="block text-xs font-bold text-[#9fadbc] mb-2">Visibility</label>
                <div className="flex rounded-lg overflow-hidden border border-[#A6C5E2]/[0.16] mb-4">
                  {(['team', 'personal'] as const).map(v => (
                    <button
                      key={v} type="button"
                      onClick={() => setNewBoardVisibility(v)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${newBoardVisibility === v ? 'bg-[#579dff] text-[#1d2125]' : 'bg-[#22272B] text-[#9fadbc] hover:text-white'}`}
                    >
                      {v === 'team' ? <><Users size={12}/> Team</> : <><Lock size={12}/> Only me</>}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-[#9fadbc] mb-2">Background</label>
                <div className="grid grid-cols-6 gap-2 mb-5">
                  {BOARD_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setNewBoardColor(color)}
                      className={`w-full pt-[100%] rounded-lg relative hover:opacity-90 transition-opacity ${newBoardColor === color ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-[#282E33]' : ''}`}
                      style={{ backgroundColor: color }}
                    >
                      {newBoardColor === color && <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">✓</div>}
                    </button>
                  ))}
                </div>

                <button type="submit" disabled={creating}
                  className="w-full py-2.5 rounded-lg bg-[#579dff] text-[#1d2125] font-bold text-sm hover:bg-[#85b8ff] transition-colors flex items-center justify-center shadow"
                >
                  {creating ? <LoadingSpinner size="sm" color="border-[#1d2125]" /> : 'Create board'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
