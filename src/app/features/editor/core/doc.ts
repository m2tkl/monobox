import type { Transaction } from '@tiptap/pm/state';

import { isInternalLink } from '~/utils/link';

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
