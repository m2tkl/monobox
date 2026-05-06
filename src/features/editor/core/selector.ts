import type { Editor } from '@tiptap/core';

/**
 * Find the active heading ID based on the current cursor position in the editor
 *
 * First checks if the cursor is currently inside a heading node and returns its ID.
 * If not inside a heading, finds the most recent heading that appears before
 * the cursor position in the document.
 *
 * @param editor Tiptap Editor instance
 * @returns The ID of the active heading, or null if no heading is found
 */
export const findActiveHeadingId = (editor: Editor): string | null => {
  // If the cursor is currently inside a heading, return it.
  const { $anchor } = editor.state.selection;
  for (let depth = $anchor.depth; depth >= 0; depth--) {
    const node = $anchor.node(depth);
    if (node.type.name === 'heading') {
      return node.attrs.id;
    }
  }

  // If the cursor is not inside a heading node, find the closest heading above the current position.
  const { state } = editor;
  const { from } = state.selection;
  let foundHeadingId: string | null = null;
  state.doc.nodesBetween(0, from, (node) => {
    if (node.type.name === 'heading') {
      foundHeadingId = node.attrs.id ?? null;
    }
  });

  return foundHeadingId;
};
