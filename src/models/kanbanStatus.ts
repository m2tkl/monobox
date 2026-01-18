export type KanbanStatus = {
  id: number;
  workspace_id: number;
  kanban_id: number;
  name: string;
  color?: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};
