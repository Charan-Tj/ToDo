"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useBoard } from "@/hooks/useBoard";
import { useRealtime } from "@/hooks/useRealtime";
import { db } from "@/lib/db";
import { ListColumn } from "@/components/ListColumn";
import { CardModal } from "@/components/CardModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BoardViews, ViewType } from "@/components/BoardViews";
import { TableView } from "@/components/TableView";
import { Plus, Star, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { Card } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function BoardPage({ params }: { params: { id: string } }) {
  const { data, loading, error, refresh } = useBoard(params.id);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [currentView, setCurrentView] = useState<ViewType>("board");
  const toast = useToast();
  const router = useRouter();

  useRealtime(params.id, () => {
    refresh();
  });

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (!data) return;

    const sourceList = data.lists.find(l => l.id === source.droppableId);
    const destList = data.lists.find(l => l.id === destination.droppableId);
    if (!sourceList || !destList) return;

    const newCards = Array.from(data.cards);
    const draggedCardIndex = newCards.findIndex(c => c.id === draggableId);
    if (draggedCardIndex === -1) return;

    const draggedCard = newCards[draggedCardIndex];
    draggedCard.list_id = destList.id;

    const destCards = newCards.filter(c => c.list_id === destList.id).sort((a,b)=>a.position-b.position);
    const destIdx = destCards.findIndex(c => c.id === draggableId);
    if (destIdx > -1) destCards.splice(destIdx, 1);
    destCards.splice(destination.index, 0, draggedCard);

    let newPosition = 0;
    if (destCards.length === 1) newPosition = 1000;
    else if (destination.index === 0) newPosition = destCards[1].position / 2;
    else if (destination.index === destCards.length - 1) newPosition = destCards[destCards.length - 2].position + 1000;
    else newPosition = (destCards[destination.index - 1].position + destCards[destination.index + 1].position) / 2;

    try {
      await db.updateCardPosition(draggableId, destList.id, newPosition);
      refresh(); 
    } catch(e) {
      toast((e as Error).message, 'error');
      refresh();
    }
  };

  const handleAddListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !data) return;
    
    const pos = data.lists.length > 0 ? data.lists[data.lists.length - 1].position + 1000 : 1000;
    try {
      await db.createList(params.id, newListTitle.trim(), pos);
      setNewListTitle("");
      setIsAddingList(false);
      refresh();
    } catch(e) {
      toast((e as Error).message, 'error');
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1d2125] transition-colors"><LoadingSpinner color="border-[#0c66e4] dark:border-[#579dff]" size="lg" /></div>;
  if (error || !data) return <div className="text-red-500 p-8 bg-white dark:bg-[#1d2125] transition-colors">Error: {error}</div>;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative" style={{ backgroundColor: data.board.bg_color }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/5" />

      <div className="h-12 px-3 flex items-center justify-between bg-black/15 backdrop-blur-[2px] shrink-0 relative z-10 w-full border-b border-white/20">
        <div className="flex items-center gap-2">
          <h1
            className="text-[18px] font-semibold text-white cursor-pointer hover:bg-white/20 rounded px-3 py-1.5 transition-colors shadow-sm"
            onClick={async () => {
               const newName = prompt("Board name:", data.board.name);
               if (newName?.trim() && newName.trim() !== data.board.name) {
                 try { await db.updateBoardName(data.board.id, newName.trim()); refresh(); } catch(e) { toast((e as Error).message, 'error')}
               }
            }}
          >
            {data.board.name}
          </h1>
          <button className="p-2 text-white hover:bg-white/20 rounded transition-colors shadow-sm" title="Star this board">
            <Star size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <BoardViews currentView={currentView} onViewChange={setCurrentView} />
          <button
            onClick={() => router.push('/dashboard')}
            className="px-3 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors shadow-sm"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Render different views based on selection */}
      {currentView === "board" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 whitespace-nowrap custom-scrollbar flex items-start gap-3 relative z-10 h-full">
          <DragDropContext onDragEnd={onDragEnd}>
            <AnimatePresence>
              {data.lists.map((list) => {
                const listCards = data.cards.filter(c => c.list_id === list.id).sort((a,b)=>a.position-b.position);
                return (
                  <ListColumn
                    key={list.id}
                    list={list}
                    cards={listCards}
                    onRefresh={refresh}
                    onOpenCard={(id) => setSelectedCardId(id)}
                  />
                );
              })}
            </AnimatePresence>
          </DragDropContext>

          {isAddingList ? (
             <div className="w-[272px] shrink-0 bg-[#ebecf0] dark:bg-[#101204] rounded-xl p-2.5 shadow-lg transition-all">
               <form onSubmit={handleAddListSubmit}>
                 <input
                   autoFocus
                   value={newListTitle}
                   onChange={e => setNewListTitle(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Escape') setIsAddingList(false); }}
                   placeholder="Enter list title..."
                   className="w-full bg-white dark:bg-[#22272B] text-[#172b4d] dark:text-[#B6C2CF] placeholder-[#44546f] dark:placeholder-[#9fadbc] border-2 border-[#0c66e4] dark:border-[#579dff] text-sm rounded-lg px-3 py-2 focus:outline-none mb-2 shadow-sm"
                 />
                 <div className="flex items-center gap-2">
                   <button type="submit" className="bg-[#0c66e4] dark:bg-[#579dff] text-white dark:text-[#1d2125] font-medium text-sm px-3 py-1.5 rounded-md hover:bg-[#0055cc] dark:hover:bg-[#85b8ff] transition-colors shadow-sm">Add list</button>
                   <button type="button" onClick={() => setIsAddingList(false)} className="text-[#44546f] dark:text-[#9fadbc] hover:text-[#172b4d] dark:hover:text-[#B6C2CF] p-1.5 rounded hover:bg-[#091e4224] dark:hover:bg-[#A6C5E2]/[0.16] transition-colors"><X size={20} /></button>
                 </div>
               </form>
             </div>
           ) : (
             <button
               onClick={() => setIsAddingList(true)}
               className="w-[272px] shrink-0 bg-white/30 dark:bg-[#ffffff3d] hover:bg-white/40 dark:hover:bg-[#ffffff52] text-white font-semibold text-sm rounded-xl px-3 py-2.5 flex items-center gap-2 transition-all text-left backdrop-blur-sm shadow-sm hover:shadow-md"
             >
               <Plus size={18} />
               Add another list
             </button>
           )}
        </div>
      ) : currentView === "table" ? (
        <TableView
          cards={data.cards}
          lists={data.lists}
          onOpenCard={(id) => setSelectedCardId(id)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1d2125] transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-2">🚧</div>
            <h3 className="text-lg font-semibold text-[#172b4d] dark:text-white mb-2">
              {currentView.charAt(0).toUpperCase() + currentView.slice(1)} View
            </h3>
            <p className="text-[#44546f] dark:text-[#9fadbc]">
              This view is coming soon!
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedCardId && (
          <CardModal
            card={data.cards.find(c => c.id === selectedCardId) as Card}
            boardId={data.board.id}
            onClose={() => setSelectedCardId(null)}
            onRefresh={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
