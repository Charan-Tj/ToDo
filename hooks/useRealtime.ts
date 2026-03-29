import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtime(boardId: string | null, onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!boardId) return;

    const channel = supabase.channel(`board-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        onUpdateRef.current();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
        onUpdateRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);
}
