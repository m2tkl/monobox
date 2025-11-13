import type { JSONContent } from '@tiptap/vue-3';

import { convertEditorJsonToHtml } from '~/lib/editor';

function escapeHtml(str: string): string {
  return str
    .replaceAll(/&/g, '&amp;')
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/"/g, '&quot;')
    .replaceAll(/'/g, '&#39;');
}

/**
 * Convert memo content to  a complete html string
 *
 * @param json - The TipTap JSON content representing the memo body
 * @param title - The memo title to be rendered as an H1 heading
 * @returns Complete HTML string with the title as H1 followed by the memo content
 */
export function convertMemoToHtml(content: JSONContent, title: string): string {
  const htmlBody = convertEditorJsonToHtml(content);
  return `<h1>${escapeHtml(title)}</h1>${htmlBody}`;
}

export function createHtmlLink(href: string, text: string): string {
  return `<a href="${href}">${text}</a>`;
}
