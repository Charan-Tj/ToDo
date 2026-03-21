"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Trash2, LayoutGrid, Plus, Sparkles, ClipboardList, ArrowRight } from "lucide-react";
import { useBoards } from "@/hooks/useBoards";
import { db } from "@/lib/db";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { Board } from "@/lib/types";

const BOARD_COLORS = ['#3D5A53', '#6B5B4D', '#5D4E60', '#4B5D4A', '#7A5A3A', '#6B4F4F', '#4A5568', '#2F6A62'];
const DASHBOARD_ORDER_KEY = "copyflow:dashboard-board-order";

function sortBoardsBySavedOrder(items: Board[], savedOrder: string[]) {
  const orderIndex = new Map(savedOrder.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const aPos = orderIndex.has(a.id) ? orderIndex.get(a.id)! : Number.MAX_SAFE_INTEGER;
    const bPos = orderIndex.has(b.id) ? orderIndex.get(b.id)! : Number.MAX_SAFE_INTEGER;
    if (aPos !== bPos) return aPos - bPos;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function DashboardPage() {
  const { boards, loading, error, refresh } = useBoards();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardColor, setNewBoardColor] = useState(BOARD_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [orderedBoards, setOrderedBoards] = useState<Board[]>([]);
  const router = useRouter();
  const toast = useToast();

  const boardIds = useMemo(() => orderedBoards.map((b) => b.id), [orderedBoards]);

  useEffect(() => {
    const savedRaw = localStorage.getItem(DASHBOARD_ORDER_KEY);
    let savedOrder: string[] = [];
    if (savedRaw) {
      try {
        savedOrder = JSON.parse(savedRaw) as string[];
      } catch {
        savedOrder = [];
      }
    }
    setOrderedBoards(sortBoardsBySavedOrder(boards, savedOrder));
  }, [boards]);

  const persistOrder = (items: Board[]) => {
    localStorage.setItem(DASHBOARD_ORDER_KEY, JSON.stringify(items.map((b) => b.id)));
  };

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
      await refresh();
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
      const nextBoards = orderedBoards.filter((b) => b.id !== id);
      setOrderedBoards(nextBoards);
      persistOrder(nextBoards);
      await refresh();
      toast("Board deleted");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const handleReorder = (nextOrder: Board[]) => {
    setOrderedBoards(nextOrder);
    persistOrder(nextOrder);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="relative flex-1 overflow-y-auto w-full custom-scrollbar text-[var(--text)] transition-colors app-grid-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(31,111,102,0.08),transparent_34%),radial-gradient(circle_at_100%_20%,rgba(98,114,126,0.07),transparent_32%)]" />
      <div className="relative max-w-6xl mx-auto p-6 md:p-8">

        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <div className="w-11 h-11 rounded-xl bg-[linear-gradient(135deg,var(--primary),#2f7f76)] flex items-center justify-center shadow-md">
             <span className="text-white font-bold text-xl leading-none">C</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] tracking-tight">CopyFlow Workspace</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage boards, plan tasks, and keep your team aligned.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 mt-1">
           <LayoutGrid size={18} className="text-[var(--text-muted)]" />
           <h2 className="text-base font-semibold text-[var(--text)] tracking-tight">Your boards</h2>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <LoadingSpinner color="border-[var(--primary)]" size="lg" />
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={orderedBoards}
            onReorder={handleReorder}
            as="div"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[104px]"
          >
            {orderedBoards.map(b => (
              <Reorder.Item
                value={b}
                key={b.id}
                whileDrag={{ scale: 1.03, zIndex: 10 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/board/${b.id}`)}
                className="relative rounded-[14px] cursor-pointer overflow-hidden p-3 group shadow-[0_3px_10px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.2)] transition-all"
                style={{ backgroundColor: b.bg_color }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/15 to-black/35" />
                <div className="absolute inset-x-3 bottom-3 top-11 z-10 rounded-md border border-white/20 bg-black/10 backdrop-blur-[1px] p-2">
                  <div className="grid grid-cols-3 gap-1.5 h-full">
                    <div className="rounded bg-white/18" />
                    <div className="rounded bg-white/12" />
                    <div className="rounded bg-white/16" />
                  </div>
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/25 text-white/90">
                    <ClipboardList size={14} />
                  </span>
                  <h3 className="text-white font-semibold text-[15px] leading-tight break-words drop-shadow max-w-[170px] truncate">
                    {b.name}
                  </h3>
                </div>
                <span className="absolute top-2 right-2 z-10 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-black/25 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                  Drag
                </span>
                <button
                  onClick={(e) => handleDelete(e, b.id)}
                  className="absolute bottom-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-black/30 rounded text-white/90 hover:text-white transition-all z-20"
                >
                  <Trash2 size={14} />
                </button>
              </Reorder.Item>
            ))}

            <motion.button
              type="button"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="rounded-[14px] cursor-pointer border-2 border-dashed border-[var(--border)] bg-[color:var(--bg-elevated)]/65 hover:bg-[var(--bg-muted)] flex flex-col items-center justify-center text-[var(--text)] transition-colors font-semibold text-sm gap-1"
            >
              <Plus size={17} className="text-[var(--primary)]" />
              <span>Create new board</span>
            </motion.button>
          </Reorder.Group>
        )}

        {boardIds.length > 1 && (
          <p className="text-xs text-[var(--text-muted)] mt-3">Drag board tiles to reorder your dashboard.</p>
        )}

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 app-surface p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">Recent activity</h3>
              <span className="text-xs text-[var(--text-muted)]">Latest updates</span>
            </div>

            {orderedBoards.length > 0 ? (
              <div className="space-y-2">
                {orderedBoards.slice(0, 3).map((board) => (
                  <button
                    key={`activity-${board.id}`}
                    type="button"
                    onClick={() => router.push(`/board/${board.id}`)}
                    className="w-full text-left rounded-md border border-[var(--border)] bg-[color:var(--bg-elevated)]/70 hover:bg-[var(--bg-muted)] px-3 py-2.5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{board.name}</p>
                      <ArrowRight size={14} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Last created {formatDate(board.created_at)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No board activity yet. Create your first board to get started.</p>
            )}
          </section>

          <section className="app-surface p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-[var(--primary)]" />
              <h3 className="text-sm font-semibold text-[var(--text)]">Getting started</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li>Create a board for each product or team.</li>
              <li>Add lists for each stage of your workflow.</li>
              <li>Drag boards and cards to keep priorities clear.</li>
            </ul>
          </section>
        </div>
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
              className="app-panel p-6 w-full max-w-[360px]"
            >
              <h2 className="text-sm font-semibold text-[var(--text-muted)] text-center w-full mb-5">Create board</h2>
              <form onSubmit={handleCreateBoard}>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Board title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  className="input-base mb-4"
                  required
                  autoFocus
                />

                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Background</label>
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
                  className="btn btn-primary w-full py-2.5 text-sm flex items-center justify-center"
                >
                  {creating ? <LoadingSpinner size="sm" color="border-white dark:border-[#1d2125]" /> : 'Create'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
