export type KanbanAssignmentItem = {
  memo_id: number;
  slug_title: string;
  title: string;
  description?: string | null;
  kanban_status_id?: number | null;
  position?: number | null;
  modified_at: string;
  kanban_id: number;
};

export type KanbanAssignmentEntry = {
  kanban_id: number;
  kanban_name: string;
  kanban_status_id?: number | null;
  kanban_status_name?: string | null;
  kanban_status_color?: string | null;
  position?: number | null;
};
