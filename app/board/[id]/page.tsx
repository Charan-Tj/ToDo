"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { DragDropContext, DropResult, Draggable, Droppable } from "@hello-pangea/dnd";
import { useBoard } from "@/hooks/useBoard";
import { useRealtime } from "@/hooks/useRealtime";
import { db } from "@/lib/db";
import { ListColumn } from "@/components/ListColumn";
import { CardModal } from "@/components/CardModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BoardViews, ViewType } from "@/components/BoardViews";
import { TableView } from "@/components/TableView";
import { EisenhowerView } from "@/components/EisenhowerView";
import { Plus, Star, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { Card } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function BoardPage({ params }: { params: { id: string } }) {
  const { data, loading, error, refresh, updateData } = useBoard(params.id);
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
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (!data) return;

    if (type === "list") {
      const orderedLists = [...data.lists].sort((a, b) => a.position - b.position);
      const nextLists = [...orderedLists];
      const [moved] = nextLists.splice(source.index, 1);
      nextLists.splice(destination.index, 0, moved);

      try {
        await db.updateListPositions(nextLists.map((list) => list.id));
        refresh();
      } catch (e) {
        toast((e as Error).message, 'error');
      }
      return;
    }

    const sourceList = data.lists.find(l => l.id === source.droppableId);
    const destList = data.lists.find(l => l.id === destination.droppableId);
    if (!sourceList || !destList) return;

    const draggedCardIndex = data.cards.findIndex(c => c.id === draggableId);
    if (draggedCardIndex === -1) return;

    const previousData = data;
    const draggedCard = { ...data.cards[draggedCardIndex], list_id: destList.id };

    const destCards = data.cards
      .filter(c => c.list_id === destList.id && c.id !== draggableId)
      .sort((a, b) => a.position - b.position);
    destCards.splice(destination.index, 0, draggedCard);

    let newPosition = 0;
    if (destCards.length === 1) newPosition = 1000;
    else if (destination.index === 0) newPosition = destCards[1].position / 2;
    else if (destination.index === destCards.length - 1) newPosition = destCards[destCards.length - 2].position + 1000;
    else newPosition = (destCards[destination.index - 1].position + destCards[destination.index + 1].position) / 2;

    updateData((current) => {
      if (!current) return current;
      return {
        ...current,
        cards: current.cards.map((card) =>
          card.id === draggableId
            ? { ...card, list_id: destList.id, position: newPosition }
            : card
        ),
      };
    });

    try {
      await db.updateCardPosition(draggableId, destList.id, newPosition);
    } catch(e) {
      toast((e as Error).message, 'error');
      updateData(() => previousData);
      refresh();
    }
  };

  const handleAddListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !data) return;

    const orderedLists = [...data.lists].sort((a, b) => a.position - b.position);
    const pos = orderedLists.length > 0 ? orderedLists[orderedLists.length - 1].position + 1000 : 1000;
    try {
      await db.createList(params.id, newListTitle.trim(), pos);
      setNewListTitle("");
      setIsAddingList(false);
      refresh();
    } catch(e) {
      toast((e as Error).message, 'error');
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center transition-colors"><LoadingSpinner color="border-[var(--primary)]" size="lg" /></div>;
  if (error || !data) return <div className="text-red-500 p-8 transition-colors">Error: {error}</div>;

  const orderedLists = [...data.lists].sort((a, b) => a.position - b.position);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative app-grid-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/8 to-black/12" />

      <div className="h-14 px-4 flex items-center justify-between glass-navbar shrink-0 relative z-10 w-full">
        <div className="flex items-center gap-2">
          <h1
            className="text-[18px] font-semibold text-white cursor-pointer hover:bg-white/20 rounded-[10px] px-3 py-2 transition-colors"
            onClick={async () => {
               const newName = prompt("Board name:", data.board.name);
               if (newName?.trim() && newName.trim() !== data.board.name) {
                 try { await db.updateBoardName(data.board.id, newName.trim()); refresh(); } catch(e) { toast((e as Error).message, 'error')}
               }
            }}
          >
            {data.board.name}
          </h1>
          <button className="p-2 text-white hover:bg-white/20 rounded-[10px] transition-colors" title="Star this board">
            <Star size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <BoardViews currentView={currentView} onViewChange={setCurrentView} />
          <button
            onClick={() => router.push('/dashboard')}
            className="px-3 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-[10px] transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Render different views based on selection */}
      {currentView === "board" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 whitespace-nowrap custom-scrollbar relative z-10 h-full">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex items-start gap-3 h-full">
              <Droppable droppableId="board-lists" direction="horizontal" type="list">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex items-start gap-3 h-full">
                    <AnimatePresence>
                      {orderedLists.map((list, index) => {
                        const listCards = data.cards.filter(c => c.list_id === list.id).sort((a, b) => a.position - b.position);
                        return (
                          <Draggable key={list.id} draggableId={list.id} index={index}>
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                style={dragProvided.draggableProps.style}
                                className="shrink-0"
                              >
                                <ListColumn
                                  list={list}
                                  cards={listCards}
                                  onRefresh={refresh}
                                  onOpenCard={(id) => setSelectedCardId(id)}
                                  listDragHandleProps={dragProvided.dragHandleProps}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {isAddingList ? (
                 <div className="w-[272px] shrink-0 app-surface p-2.5 transition-all">
                   <form onSubmit={handleAddListSubmit}>
                     <input
                       autoFocus
                       value={newListTitle}
                       onChange={e => setNewListTitle(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Escape') setIsAddingList(false); }}
                       placeholder="Enter list title..."
                       className="input-base mb-2"
                     />
                     <div className="flex items-center gap-2">
                       <button type="submit" className="btn btn-primary text-sm px-3 py-2">Add list</button>
                       <button
                         type="button"
                         onClick={() => setIsAddingList(false)}
                         className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-muted)] rounded-md transition-colors"
                         title="Cancel"
                       >
                         <X size={20} />
                       </button>
                     </div>
                   </form>
                 </div>
               ) : (
                 <button
                   onClick={() => setIsAddingList(true)}
                   className="w-[272px] shrink-0 bg-white/8 hover:bg-white/15 text-white/70 hover:text-white font-semibold text-sm rounded-[14px] px-3 py-3 flex items-center gap-2 transition-all text-left backdrop-blur-sm border border-white/12 hover:border-white/22"
                 >
                   <Plus size={18} />
                   Add another list
                 </button>
               )}
            </div>
          </DragDropContext>
        </div>
      ) : currentView === "table" ? (
        <TableView
          cards={data.cards}
          lists={data.lists}
          onOpenCard={(id) => setSelectedCardId(id)}
        />
      ) : currentView === "matrix" ? (
        <EisenhowerView
          cards={data.cards}
          lists={data.lists}
          onOpenCard={(id) => setSelectedCardId(id)}
          onRefresh={refresh}
        />
      ) : null}

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
