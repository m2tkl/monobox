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

/**
 * Finds the last visible heading that has been pushed up out of view due to scrolling.
 *
 * @param editorContainer - The main editor container element.
 * @returns The ID of the last heading pushed out of view, or undefined if none is found.
 */
export const getLastVisibleHeadingId = (editorContainer: HTMLElement): string | undefined => {
  const headings = editorContainer.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]') as NodeListOf<HTMLElement>;
  if (!headings.length) return;

  const containerRect = editorContainer.getBoundingClientRect();
  let activeId: string | null = null;

  headings.forEach((heading) => {
    const rect = heading.getBoundingClientRect();
    // NOTE: Adjust as needed by adding an offset.
    if (rect.top < containerRect.top + 100) {
      activeId = heading.getAttribute('id');
    }
  });

  return activeId ?? undefined;
};

export const getLinkFromMouseClickEvent = (
  event: MouseEvent,
): string | undefined => {
  if (!event.target) {
    return;
  }

  const link = (event.target as HTMLElement).closest('a');
  if (!link) {
    return;
  }

  const url = link.getAttribute('href');
  if (!url) {
    return;
  }

  return url;
};
