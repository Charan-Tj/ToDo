import { supabase } from "./supabase";
import { Board, List, Card } from "./types";

export const db = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getBoards() {
    const { data, error } = await supabase.from('boards').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Board[];
  },

  async createBoard(name: string, bg_color: string, user_id: string, visibility: 'team' | 'personal' = 'team') {
    const { data, error } = await supabase.from('boards').insert([{ name, bg_color, created_by: user_id, visibility }]).select();
    if (error) throw error;
    return data[0] as Board;
  },

  async deleteBoard(id: string) {
    const { error } = await supabase.from('boards').delete().eq('id', id);
    if (error) throw error;
  },

  async getBoardData(boardId: string) {
    const [boardRes, listsRes, cardsRes] = await Promise.all([
      supabase.from('boards').select('*').eq('id', boardId).single(),
      supabase.from('lists').select('*').eq('board_id', boardId).order('position', { ascending: true }),
      supabase.from('cards').select('*').in('list_id', (await supabase.from('lists').select('id').eq('board_id', boardId)).data?.map((l) => l.id) || [])
    ]);
    if (boardRes.error && boardRes.error.code !== 'PGRST116') throw boardRes.error;
    if (listsRes.error) throw listsRes.error;
    if (cardsRes.error) throw cardsRes.error;

    return {
      board: (boardRes.data || { id: boardId, name: "Unknown board", bg_color: "", created_by: "", created_at: new Date().toISOString() }) as Board,
      lists: listsRes.data as List[],
      cards: cardsRes.data as Card[],
    };
  },

  async updateBoardName(id: string, name: string) {
    const { error } = await supabase.from('boards').update({ name }).eq('id', id);
    if (error) throw error;
  },

  async createList(board_id: string, title: string, position: number) {
    const { data, error } = await supabase.from('lists').insert([{ board_id, title, position }]).select();
    if (error) throw error;
    return data[0] as List;
  },

  async updateListPositions(listIdsInOrder: string[]) {
    const updates = listIdsInOrder.map((id, index) =>
      supabase.from('lists').update({ position: (index + 1) * 1000 }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((res) => res.error);
    if (failed?.error) throw failed.error;
  },

  async updateListTitle(id: string, title: string) {
    const { error } = await supabase.from('lists').update({ title }).eq('id', id);
    if (error) throw error;
  },

  async updateListColor(id: string, bg_color: string): Promise<boolean> {
    const { error } = await supabase.from('lists').update({ bg_color }).eq('id', id);
    if (!error) return true;

    const msg = String(error.message || '').toLowerCase();
    const details = String((error as { details?: string }).details || '').toLowerCase();
    const columnMissing = msg.includes("bg_color") && (msg.includes("schema cache") || msg.includes("column"));
    const detailsColumnMissing = details.includes("bg_color") && details.includes("column");

    // Older DB schemas may not have lists.bg_color yet.
    // Treat it as unsupported and let the UI fall back to local-only color state.
    if (columnMissing || detailsColumnMissing) return false;

    throw error;
  },

  async archiveList(id: string) {
    const { error } = await supabase.from('lists').update({ archived: true }).eq('id', id);
    if (error) throw error;
  },

  async deleteList(id: string) {
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) throw error;
  },

  async createCard(list_id: string, title: string, position: number, extra?: Partial<Card>) {
    const { data, error } = await supabase.from('cards').insert([{ list_id, title, position, ...extra }]).select();
    if (error) throw error;
    return data[0] as Card;
  },

  async updateCardPosition(cardId: string, listId: string, position: number) {
    const { error } = await supabase.from('cards').update({ list_id: listId, position }).eq('id', cardId);
    if (error) throw error;
  },

  async updateCard(cardId: string, updates: Partial<Card>) {
    const { error } = await supabase.from('cards').update(updates).eq('id', cardId);
    if (error) throw error;
  },

  async deleteCard(id: string) {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) throw error;
  }
};
