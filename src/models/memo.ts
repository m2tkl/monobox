export type MemoDetail = {
  id: number;
  slug_title: string;
  title: string;
  content: string; // JSON
  description?: string;
  workspace_id: number;
  created_at: string;
  updated_at: string;
};

export type MemoIndexItem = {
  id: number;
  slug_title: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
