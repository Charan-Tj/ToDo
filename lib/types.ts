export type User = {
  id: string;
  email: string;
};

export type Board = {
  id: string;
  name: string;
  bg_color: string;
  visibility: 'team' | 'personal';
  created_by: string;
  created_at: string;
};

export type List = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  bg_color?: string;
  archived?: boolean;
  created_at: string;
};

export type ChecklistItem = {
  text: string;
  done: boolean;
};

export type Card = {
  id: string;
  list_id: string;
  title: string;
  description: string;
  due_date: string | null;
  labels: string[];
  checklist: ChecklistItem[];
  assignee: string;
  position: number;
  completed: boolean;
  created_at: string;
};

export type BoardData = {
  board: Board;
  lists: List[];
  cards: Card[];
};
