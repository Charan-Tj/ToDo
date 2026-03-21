import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtime(boardId: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase.channel(`board-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, onUpdate]);
}
