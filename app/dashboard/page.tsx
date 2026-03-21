"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Clock } from "lucide-react";
import { useBoards } from "@/hooks/useBoards";
import { db } from "@/lib/db";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

const BOARD_COLORS = ['#0079BF', '#D29034', '#519839', '#B04632', '#89609E', '#CD5A91', '#4BBF6B', '#00AECC'];

export default function DashboardPage() {
  const { boards, loading, error, refresh } = useBoards();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardColor, setNewBoardColor] = useState(BOARD_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const toast = useToast();

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    setCreating(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Not logged in");
      await db.createBoard(newBoardName, newBoardColor, data.session.user.id);
      setIsModalOpen(false);
      setNewBoardName("");
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
    if (!confirm("Delete board forever?")) return;
    try {
      await db.deleteBoard(id);
      refresh();
      toast("Board deleted");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto w-full custom-scrollbar text-[#172b4d]">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-[#0c66e4] to-[#0055cc] flex items-center justify-center shadow-md">
             <span className="text-white font-bold text-xl leading-none">C</span>
          </div>
          <h1 className="text-xl font-bold text-[#172b4d] tracking-tight">CopyFlow Workspace</h1>
        </div>

        <div className="flex items-center gap-2 mb-3 mt-8">
           <Clock size={18} className="text-[#44546f]" />
           <h2 className="text-base font-semibold text-[#172b4d] tracking-tight">Your boards</h2>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <LoadingSpinner color="border-[#0c66e4]" size="lg" />
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[96px]"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.04 } }
            }}
          >
            {boards.map(b => (
              <motion.div
                key={b.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/board/${b.id}`)}
                className="relative rounded-lg cursor-pointer overflow-hidden p-2 group shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: b.bg_color }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/10 to-black/20" />
                <h3 className="relative z-10 text-white font-semibold text-[15px] pt-1.5 pl-1.5 leading-tight break-words drop-shadow">
                  {b.name}
                </h3>
                <button
                  onClick={(e) => handleDelete(e, b.id)}
                  className="absolute bottom-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-black/30 rounded text-white/90 hover:text-white transition-all z-20"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}

            <motion.div
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg cursor-pointer bg-[#091e420f] hover:bg-[#091e4224] flex items-center justify-center text-[#172b4d] hover:text-[#172b4d] transition-colors font-medium text-sm"
            >
              Create new board
            </motion.div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-[360px] shadow-2xl"
            >
              <h2 className="text-sm font-semibold text-[#44546f] text-center w-full mb-5">Create board</h2>
              <form onSubmit={handleCreateBoard}>
                <label className="block text-xs font-semibold text-[#44546f] mb-2">Board title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  className="w-full bg-[#f5f6f8] text-[#172b4d] border-2 border-[#0c66e4] text-sm rounded-md px-3 py-2 focus:outline-none mb-4"
                  required
                  autoFocus
                />

                <label className="block text-xs font-semibold text-[#44546f] mb-2">Background</label>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {BOARD_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewBoardColor(color)}
                      className="w-full pt-[100%] rounded-md relative hover:opacity-80 transition-opacity shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {newBoardColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xl">✓</div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 rounded-md bg-[#0c66e4] text-white font-medium text-sm hover:bg-[#0055cc] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
                >
                  {creating ? <LoadingSpinner size="sm" color="border-white" /> : 'Create'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
