export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error?: unknown };

export type MemoEditingAction =
  | { type: 'action/open-kanban-modal' }
  | { type: 'action/toggle-bookmark' }
  | { type: 'action/toggle-focus-memo' }
  | { type: 'action/open-slide-mode' }
  | { type: 'action/copy-markdown' }
  | { type: 'action/copy-html' }
  | { type: 'action/export-with-linked-pages' }
  | { type: 'action/copy-exported-result'; textToCopy: string }
  | { type: 'action/start-image-alt-editing' }
  | { type: 'action/open-selected-image-preview' }
  | { type: 'action/open-link-palette' }
  | { type: 'action/start-link-editing' }
  | { type: 'action/unset-link' }
  | { type: 'action/toggle-editor-style'; style: 'bold' | 'italic' | 'strike' }
  | { type: 'action/toggle-inline-code' }
  | { type: 'action/reset-editor-style' }
  | { type: 'action/copy-selected-markdown' }
  | { type: 'action/copy-link-to-heading'; fullUrl: string; titleWithHeading: string };
