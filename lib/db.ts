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
    const boardRes = await supabase.from('boards').select('*').eq('id', boardId).single();
    if (boardRes.error && boardRes.error.code !== 'PGRST116') throw boardRes.error;
    const board = (boardRes.data || { id: boardId, name: "Unknown", bg_color: "", created_by: "", visibility: "team", created_at: new Date().toISOString() }) as Board;

    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;

    let listsQuery = supabase.from('lists').select('*');
    if (board.visibility === 'personal' && userEmail) {
      listsQuery = listsQuery.or(`board_id.eq.${boardId},assignee_email.eq.${userEmail}`);
    } else {
      listsQuery = listsQuery.eq('board_id', boardId);
    }

    const listsRes = await listsQuery;
    if (listsRes.error) throw listsRes.error;

    const lists = (listsRes.data as List[])
       .filter(l => !l.archived)
       .sort((a,b) => a.position - b.position);

    const listIds = lists.map(l => l.id);
    const cardsRes = listIds.length > 0 ? await supabase.from('cards').select('*').in('list_id', listIds) : { data: [], error: null };
    if (cardsRes.error) throw cardsRes.error;

    return {
      board,
      lists,
      cards: cardsRes.data as Card[],
    };
  },

  async updateBoardName(id: string, name: string) {
    const { error } = await supabase.from('boards').update({ name }).eq('id', id);
    if (error) throw error;
  },

  async createList(board_id: string, title: string, position: number, assignee_email?: string) {
    const payload: Partial<List> & { board_id: string, title: string, position: number } = { board_id, title, position };
    if (assignee_email) payload.assignee_email = assignee_email;
    const { data, error } = await supabase.from('lists').insert([payload]).select();
    if (error) throw error;
    return data[0] as List;
  },

  async updateListAssignee(id: string, assignee_email: string | null) {
    const { error } = await supabase.from('lists').update({ assignee_email }).eq('id', id);
    if (error) throw error;
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
