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
  return findActiveHeadingIdAtPos(editor, editor.state.selection.from);
};

/**
 * Find the active heading ID for an arbitrary document position.
 *
 * If the position is inside a heading node, that heading wins.
 * Otherwise, return the closest heading above the position.
 */
export const findActiveHeadingIdAtPos = (editor: Editor, pos: number): string | null => {
  const resolvedPos = editor.state.doc.resolve(pos);

  // If the cursor is currently inside a heading, return it.
  for (let depth = resolvedPos.depth; depth >= 0; depth--) {
    const node = resolvedPos.node(depth);
    if (node.type.name === 'heading') {
      return node.attrs.id;
    }
  }

  // If the position is not inside a heading node, find the closest heading above it.
  let foundHeadingId: string | null = null;
  editor.state.doc.nodesBetween(0, pos, (node) => {
    if (node.type.name === 'heading') {
      foundHeadingId = node.attrs.id ?? null;
    }
  });

  return foundHeadingId;
};
