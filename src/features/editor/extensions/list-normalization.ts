import { Extension } from '@tiptap/core';
import { Fragment } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';

import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

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

          return newState.tr.replaceWith(
            0,
            newState.doc.content.size,
            normalizedDoc.content,
          );
        },
      }),
    ];
  },
});
