import type { Editor } from '@tiptap/core';

/**
 * Determine whether the cursor is within the visible range of the editor
 */
export const isCaretVisible = (editor: Editor, container: HTMLElement): boolean => {
  const { state, view } = editor;
  const pos = state.selection.from;

  // Get the absolute coordinates on the screen
  // e.g. { top: 123, bottom: 137, left: 50, right: 60 }
  const caretCoords = view.coordsAtPos(pos);

  // Determine whether it is within the screen vertically.
  const containerRect = container.getBoundingClientRect();
  const isVisible
    = caretCoords.top >= containerRect.top
      && caretCoords.bottom <= containerRect.bottom;

  return isVisible;
};
