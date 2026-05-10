import { convertMemoToHtml, createHtmlLink } from './converters';

import type { Editor as _Editor } from '@tiptap/core';

import { writeHtml, writeText } from '~/external/tauri/clipboard';
import { EditorQuery, convertToMarkdown } from '~/features/editor';

/**
 * Frontend actions for copy operations used on the memo page.
 */
export function useMemoCopy() {
  const toast = useToast();
  const logger = useConsoleLogger('memo-editing/memoCopy');

  const copyPageAsMarkdown = async (editor: _Editor, title: string) => {
    try {
      const markdown = convertToMarkdown(editor.state.doc, title);
      await writeText(markdown);
      toast.add({ title: 'Copied as markdown.', icon: iconKey.success, duration: 1000 });
      return { ok: true as const };
    }
    catch (error) {
      logger.error(error);
      toast.add({
        title: 'Failed to copy.',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      });
      return { ok: false as const, error };
    }
  };

  const copyPageAsHtml = async (editor: _Editor, title: string) => {
    try {
      const html = convertMemoToHtml(editor.getJSON(), title);
      await writeHtml(html);
      toast.add({ title: 'Copied as html.', icon: iconKey.success, duration: 1000 });
      return { ok: true as const };
    }
    catch (error) {
      logger.error(error);
      toast.add({
        title: 'Failed to copy.',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      });
      return { ok: false as const, error };
    }
  };

  const copySelectedTextAsMarkdown = async (editor: _Editor) => {
    try {
      const selectedContent = EditorQuery.getSelectedNode(editor);
      const markdown = convertToMarkdown(selectedContent);
      await navigator.clipboard.writeText(markdown);
      toast.add({ title: 'Copied as markdown.', icon: iconKey.success, duration: 1000 });
      return { ok: true as const };
    }
    catch (error) {
      logger.error(error);
      toast.add({
        title: 'Failed to copy.',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      });
      return { ok: false as const, error };
    }
  };

  const copyLinkToHeading = async (fullUrl: string, titleWithHeading: string) => {
    try {
      const htmlLink = createHtmlLink(fullUrl, titleWithHeading);
      await writeHtml(htmlLink);
      toast.add({ title: 'Copied link to heading.', icon: iconKey.success, duration: 1000 });
      return { ok: true as const };
    }
    catch (error) {
      logger.error(error);
      toast.add({
        title: 'Failed to copy.',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      });
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
