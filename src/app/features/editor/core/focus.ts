import { TextSelection } from '@tiptap/pm/state';

import type { Editor } from '@tiptap/core';

/**
 * Focuses on a node with the specified ID and moves the cursor to the end of the node.
 *
 * @param id - The ID of the node to focus.
 */
export const focusNodeById = (editor: Editor, id: string) => {
  const { state, view } = editor;
  const { doc, tr } = state;

  let pos = null;
  let nodeSize = 0;

  // Search for the node with the specified ID and get its position
  doc.descendants((node, posIndex) => {
    if (node.attrs.id === id) {
      pos = posIndex;
      nodeSize = node.nodeSize;
      return false;
    }
  });

  // Move the cursor to the end of the selected node
  if (pos !== null) {
    const selectionPos = pos + nodeSize - 1;
    const newTr = tr.setSelection(TextSelection.create(tr.doc, selectionPos));
    view.dispatch(newTr);
    view.focus();
  }
};
