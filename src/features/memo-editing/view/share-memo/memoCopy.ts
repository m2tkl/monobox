import { convertMemoToHtml, createHtmlLink } from './converters';

import type { Editor as _Editor } from '@tiptap/core';

import { writeHtml, writeText } from '~/external/tauri/clipboard';
import { EditorQuery, convertToMarkdown } from '~/features/editor';

/**
 * Frontend actions for copy operations used on the memo page.
 */
export function useMemoCopy() {
  const logger = useConsoleLogger('memo-editing/memoCopy');

  const copyPageAsMarkdown = async (editor: _Editor, title: string) => {
    try {
      const markdown = convertToMarkdown(editor.state.doc, title);
      await writeText(markdown);
      return { ok: true as const, data: undefined };
    }
    catch (error) {
      logger.error(error);
      return { ok: false as const, error };
    }
  };

  const copyPageAsHtml = async (editor: _Editor, title: string) => {
    try {
      const html = convertMemoToHtml(editor.getJSON(), title);
      await writeHtml(html);
      return { ok: true as const, data: undefined };
    }
    catch (error) {
      logger.error(error);
      return { ok: false as const, error };
    }
  };

  const copySelectedTextAsMarkdown = async (editor: _Editor) => {
    try {
      const selectedContent = EditorQuery.getSelectedNode(editor);
      const markdown = convertToMarkdown(selectedContent);
      await navigator.clipboard.writeText(markdown);
      return { ok: true as const, data: undefined };
    }
    catch (error) {
      logger.error(error);
      return { ok: false as const, error };
    }
  };

  const copyLinkToHeading = async (fullUrl: string, titleWithHeading: string) => {
    try {
      const htmlLink = createHtmlLink(fullUrl, titleWithHeading);
      await writeHtml(htmlLink);
      return { ok: true as const, data: undefined };
    }
    catch (error) {
      logger.error(error);
      return { ok: false as const, error };
    }
  };

  return {
    copyPageAsMarkdown,
    copyPageAsHtml,
    copySelectedTextAsMarkdown,
    copyLinkToHeading,
  };
}
