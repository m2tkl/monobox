export type MemoDetail = {
  id: number;
  slug_title: string;
  title: string;
  content: string; // JSON
  description?: string;
  thumbnail_image?: string;
  workspace_id: number;
  created_at: string;
  updated_at: string;
  modified_at: string;
};

export type MemoIndexItem = {
  id: number;
  slug_title: string;
  title: string;
  description?: string;
  thumbnail_image?: string;
  created_at: string;
  updated_at: string;
  modified_at: string;
}
