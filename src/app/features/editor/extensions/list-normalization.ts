import { Extension } from '@tiptap/core';
import { Fragment } from '@tiptap/pm/model';
import { Plugin, TextSelection } from '@tiptap/pm/state';

import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorState } from '@tiptap/pm/state';

const MERGEABLE_LIST_TYPES = new Set([
  'bulletList',
  'orderedList',
  'taskList',
]);

/**
 * ProseMirror editing sometimes leaves visually continuous lists as adjacent
 * sibling list nodes, such as `<ul>...</ul><ul>...</ul>`, instead of keeping
 * them as one logical list. That split leaks into saved JSON/HTML and makes
 * downstream handling treat a single list as separate elements.
 *
 * This extension normalizes those adjacent sibling lists back into one node
 * after transactions, while still preserving intentional boundaries when the
 * list type or attrs differ.
 */
function hasSameAttrs(a: Record<string, unknown>, b: Record<string, unknown>) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every(key => a[key] === b[key]);
}

function canMergeLists(a: ProseMirrorNode, b: ProseMirrorNode) {
  return MERGEABLE_LIST_TYPES.has(a.type.name)
    && a.type === b.type
    && hasSameAttrs(a.attrs, b.attrs);
}

function normalizeAdjacentLists(node: ProseMirrorNode): ProseMirrorNode {
  if (node.childCount === 0) {
    return node;
  }

  let changed = false;
  const children: ProseMirrorNode[] = [];

  node.content.forEach((child) => {
    const normalizedChild = normalizeAdjacentLists(child);
    const previousChild = children.at(-1);

    if (previousChild && canMergeLists(previousChild, normalizedChild)) {
      children[children.length - 1] = previousChild.type.create(
        previousChild.attrs,
        previousChild.content.append(normalizedChild.content),
        previousChild.marks,
      );
      changed = true;
      return;
    }

    children.push(normalizedChild);
    changed ||= normalizedChild !== child;
  });

  if (!changed) {
    return node;
  }

  return node.type.create(node.attrs, Fragment.fromArray(children), node.marks);
}

type SelectionSnapshot = {
  textblockIndex: number;
  offset: number;
};

/**
 * Normalizing adjacent lists can happen immediately after another command
 * transforms the document, for example when Tab wraps a paragraph after a list
 * into a new list item. Replacing the whole doc at that point preserves the
 * content shape we want, but ProseMirror may remap the selection to the end of
 * the document. We therefore snapshot the active textblock index and character
 * offset before normalization, then restore the selection against the
 * normalized doc.
 */
function getTextblockSnapshot(state: EditorState, pos: number): SelectionSnapshot | null {
  let currentIndex = -1;
  let snapshot: SelectionSnapshot | null = null;

  state.doc.descendants((node, nodePos) => {
    if (!node.isTextblock) {
      return true;
    }

    currentIndex += 1;
    const start = nodePos + 1;
    const end = start + node.content.size;

    if (pos < start || pos > end) {
      return true;
    }

    snapshot = {
      textblockIndex: currentIndex,
      offset: state.doc.textBetween(start, pos, '\n', '\0').length,
    };
    return false;
  });

  return snapshot;
}

function resolveTextblockPosition(doc: ProseMirrorNode, snapshot: SelectionSnapshot): number | null {
  let currentIndex = -1;
  let resolvedPos: number | null = null;

  doc.descendants((node, nodePos) => {
    if (!node.isTextblock) {
      return true;
    }

    currentIndex += 1;
    if (currentIndex !== snapshot.textblockIndex) {
      return true;
    }

    const start = nodePos + 1;
    resolvedPos = start + Math.min(snapshot.offset, node.textContent.length);
    return false;
  });

  return resolvedPos;
}

export const listNormalizationExtension = Extension.create({
  name: 'listNormalization',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (_transactions, _oldState, newState) => {
          const normalizedDoc = normalizeAdjacentLists(newState.doc);

          if (normalizedDoc.eq(newState.doc)) {
            return null;
          }

          const anchorSnapshot = getTextblockSnapshot(newState, newState.selection.anchor);
          const headSnapshot = getTextblockSnapshot(newState, newState.selection.head);
          const tr = newState.tr.replaceWith(
            0,
            newState.doc.content.size,
            normalizedDoc.content,
          );

          const nextAnchor = anchorSnapshot
            ? resolveTextblockPosition(tr.doc, anchorSnapshot)
            : null;
          const nextHead = headSnapshot
            ? resolveTextblockPosition(tr.doc, headSnapshot)
            : null;

          if (nextAnchor !== null && nextHead !== null) {
            tr.setSelection(TextSelection.create(tr.doc, nextAnchor, nextHead));
          }

          return tr;
        },
      }),
    ];
  },
});
