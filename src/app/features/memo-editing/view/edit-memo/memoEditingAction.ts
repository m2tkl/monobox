export type ActionResult<T = void> =
  | { ok: true; data: T; silent?: boolean }
  | { ok: false; error?: unknown };

export type SelectedTextCopyFormat = 'html' | 'markdown';

export type MemoEditingAction =
  | { type: 'action/toggle-bookmark' }
  | { type: 'action/open-slide-mode' }
  | { type: 'action/export-markdown' }
  | { type: 'action/export-with-linked-pages' }
  | { type: 'action/start-image-alt-editing' }
  | { type: 'action/open-selected-image-preview' }
  | { type: 'action/open-link-palette' }
  | { type: 'action/start-link-editing' }
  | { type: 'action/unset-link' }
  | { type: 'action/toggle-editor-style'; style: 'bold' | 'italic' | 'strike' }
  | { type: 'action/toggle-inline-code' }
  | { type: 'action/reset-editor-style' }
  | { type: 'action/copy-selected-text'; format: SelectedTextCopyFormat }
  | { type: 'action/copy-link-to-heading'; fullUrl: string; titleWithHeading: string };
