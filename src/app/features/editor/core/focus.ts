import { TextSelection } from '@tiptap/pm/state';

import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

function findCollapsedHeadingsToReveal(doc: ProseMirrorNode, targetPos: number) {
  const stack: Array<{ level: number; node: ProseMirrorNode; pos: number }> = [];
  const headings: Array<{ node: ProseMirrorNode; pos: number }> = [];

  doc.descendants((node, pos) => {
    if (pos > targetPos) {
      return false;
    }

    if (node.type.name !== 'heading') {
      return;
    }

    const level = Number(node.attrs.level);
    while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
      stack.pop();
    }

    if (node.attrs.collapsed === true) {
      const item = { level, node, pos };
      stack.push(item);
      headings.push(item);
    }
  });

  return headings.filter(heading => heading.pos !== targetPos && stack.some(item => item.pos === heading.pos));
}

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
    const headingsToReveal = findCollapsedHeadingsToReveal(doc, pos);
    for (const heading of headingsToReveal) {
      tr.setNodeMarkup(heading.pos, undefined, {
        ...heading.node.attrs,
        collapsed: false,
      });
    }

    const selectionPos = pos + nodeSize - 1;
    const newTr = tr.setSelection(TextSelection.create(tr.doc, selectionPos));
    view.dispatch(newTr);
    view.focus();
  }
};
