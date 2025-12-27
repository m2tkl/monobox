import type { JSONContent } from '@tiptap/vue-3';

import { convertEditorJsonToHtml } from '~/app/features/editor';

function escapeHtml(str: string): string {
  return str
    .replaceAll(/&/g, '&amp;')
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/\"/g, '&quot;')
    .replaceAll(/'/g, '&#39;');
}

export function convertMemoToHtml(content: JSONContent, title: string): string {
  const htmlBody = convertEditorJsonToHtml(content);
  return `<h1>${escapeHtml(title)}</h1>${htmlBody}`;
}

export function createHtmlLink(href: string, text: string): string {
  return `<a href="${href}">${text}</a>`;
}
