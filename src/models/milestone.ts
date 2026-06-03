export type MilestoneMemo = {
  id: number;
  slug_title: string;
  title: string;
};

export type Milestone = {
  id: number;
  workspace_id: number;
  date: string;
  title: string;
  memos: MilestoneMemo[];
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
};
