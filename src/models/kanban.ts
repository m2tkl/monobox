export type Kanban = {
  id: number;
  workspace_id: number;
  name: string;
  order_index: number;
  default_status_id?: number | null;
  focus_status_id?: number | null;
  created_at: string;
  updated_at: string;
};
