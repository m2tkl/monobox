import type { JSONContent } from '@tiptap/vue-3';

import { convertEditorJsonToHtml } from '~/lib/editor/serializer/html';

/**
 * Convert memo content to  a complete html string
 *
 * @param json - The TipTap JSON content representing the memo body
 * @param title - The memo title to be rendered as an H1 heading
 * @returns Complete HTML string with the title as H1 followed by the memo content
 */
export function convertMemotoHtml(content: JSONContent, title: string): string {
  const htmlBody = convertEditorJsonToHtml(content);
  return `<h1>${title}</h1>${htmlBody}`;
}
