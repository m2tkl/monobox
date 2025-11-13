import { TextSelection } from '@tiptap/pm/state';

import type { Editor } from '@tiptap/core';
import type { Transaction } from '@tiptap/pm/state';

import { isInternalLink } from '~/utils/link';

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

/**
 * Finds the first image in the document and returns its source URL.
 *
 * This function iterates through the document's nodes and retrieves the `src`
 * attribute of the first encountered image node. If no image is found, it returns `undefined`.
 *
 * @param transaction - The current transaction containing the document state.
 * @returns The `src` URL of the first image found, or `undefined` if no image exists.
 */
export const findHeadImage = (transaction: Transaction) => {
  let foundHeadImage: string | undefined = undefined;
  transaction.doc.descendants((node) => {
    if (node.type.name === 'image' && !foundHeadImage) {
      foundHeadImage = node.attrs.src;
    }
  });

  return foundHeadImage;
};

/**
 * Identifies changes in links within the document before and after a transaction.
 *
 * This function compares the state of links in the document before and after the transaction.
 * It detects which links have been newly added and which have been removed.
 *
 * NOTE:
 *   When determining link changes, only the URL without the hash fragment is considered.
 *   e.g.: /test/page-1#123 is treated as /test/page-1
 *
 * @param transaction - The current transaction containing the document state before and after changes.
 * @returns An object containing `addedLinks` (newly added links) and `deletedLinks` (removed links).
 */
export const getChangedLinks = (transaction: Transaction) => {
  const beforeLinks = new Set<string>();
  transaction.before.descendants((node) => {
    const linkMark = node.marks.find(mark => mark.type.name === 'link');
    if (linkMark) {
      if (isInternalLink(linkMark.attrs.href)) {
        beforeLinks.add(linkMark.attrs.href.split('#')[0]);
      }
    }
  });

  // The updated links (list of href)
  const afterLinks = new Set<string>();
  transaction.doc.descendants((node) => {
    const linkMark = node.marks.find(mark => mark.type.name === 'link');
    if (linkMark) {
      if (isInternalLink(linkMark.attrs.href)) {
        afterLinks.add(linkMark.attrs.href.split('#')[0]);
      }
    }
  });

  const deletedLinks = [];
  const addedLinks = [];

  // Detect fully removed links
  for (const href of beforeLinks) {
    if (!afterLinks.has(href)) {
      deletedLinks.push(href);
    }
  }

  // Detect fully added links
  for (const href of afterLinks) {
    if (!beforeLinks.has(href)) {
      addedLinks.push(href);
    }
  }

  return {
    deletedLinks,
    addedLinks,
  };
};
