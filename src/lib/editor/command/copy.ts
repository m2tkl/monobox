import { writeHtml } from '@tauri-apps/plugin-clipboard-manager';

import type { Editor } from '@tiptap/vue-3';

import { convertMemotoHtml } from '~/lib/memo/exporter/toHtml';

/**
 * Copy link as html link
 *
 * @param href
 * @param text
 */
export const copyLinkAsHtml = async (href: string, text: string): Promise<void> => {
  const html = `<a href="${href}">${text}</a>`;
  await writeHtml(html);
};

/**
 * Copy the entire editor content as HTML to the clipboard.
 *
 * @param editor - The TipTap editor instance containing the content to copy
 * @param title - The title to be added as an H1 heading at the top of the HTML
 */
export const copyPageAsHtml = async (editor: Editor, title: string) => {
  const json = editor.getJSON();
  const htmlPage = convertMemotoHtml(json, title);

  await writeHtml(htmlPage);
};
