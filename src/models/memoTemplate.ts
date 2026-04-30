export type MemoTemplateDetail = {
  id: number;
  slug_name: string;
  name: string;
  content: string;
  is_default: boolean;
  workspace_id: number;
  created_at: string;
  updated_at: string;
};

export type MemoTemplateIndexItem = {
  id: number;
  slug_name: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};
