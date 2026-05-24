export type ManagedFileType = 'local_file' | 'external_link';

export type InboxFileItem = {
  path: string;
  display_name: string;
  kind: string;
  acquired_at: number;
};

export type InboxFilePage = {
  items: InboxFileItem[];
  total_count: number;
  limit: number;
  offset: number;
};

export type ManagedFileRecord = {
  id: string;
  type: ManagedFileType;
  display_name: string;
  note?: string | null;
  relative_path?: string | null;
  url?: string | null;
  imported_at: string;
};

export type ManagedFileListItem = {
  id: string;
  type: ManagedFileType;
  display_name: string;
  imported_at: string;
  related_note_count: number;
};

export type MemoLinkedFileItem = {
  id: string;
  type: ManagedFileType;
  display_name: string;
};

export type ManagedFileListPage = {
  items: ManagedFileListItem[];
  total_count: number;
  limit: number;
  offset: number;
};

export type RelatedNoteSummary = {
  note_id: number;
  workspace_slug_name: string;
  memo_slug_title: string;
  title: string;
};

export type ManagedFileDetail = {
  id: string;
  type: ManagedFileType;
  display_name: string;
  note?: string | null;
  relative_path?: string | null;
  url?: string | null;
  imported_at: string;
  related_notes: RelatedNoteSummary[];
};

export type ResolvedFileOpenTarget = {
  open_kind: 'path' | 'url';
  value: string;
};
