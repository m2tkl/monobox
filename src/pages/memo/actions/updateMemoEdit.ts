import type { Editor } from '@tiptap/vue-3';

import { getHeadingTextById } from '~/lib/editor';

/**
 * Returns the memo title, possibly including the heading in view.
 */
export const getMemoTitleWithHeading = (baseTitle: string, editor: Editor, routeHash: string): string => {
  if (!routeHash) return baseTitle;

  const headingId = routeHash.replace(/^#/, '');
  const headingTitle = getHeadingTextById(editor.getJSON(), headingId);

  return headingTitle ? `${baseTitle} › ${headingTitle}` : baseTitle;
};
