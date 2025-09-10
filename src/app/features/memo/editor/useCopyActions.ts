import type { Editor as _Editor } from '@tiptap/vue-3';

import { writeHtml, writeText } from '~/lib/clipboard';
import * as EditorQuery from '~/lib/editor/query.js';
import { convertToMarkdown } from '~/lib/editor/serializer/markdown';
import { convertMemoToHtml, createHtmlLink } from '~/lib/memo/exporter/toHtml';

/**
 * Provide copy-related actions used on the memo page.
 */
export function useCopyActions() {
  const { createEffectHandler } = useEffectHandler();

  const copyPageAsMarkdown = (editor: _Editor, title: string) =>
    createEffectHandler(async () => {
      const markdown = convertToMarkdown(editor.state.doc, title);
      await writeText(markdown);
    })
      .withToast('Copied as markdown.', 'Failed to copy.')
      .execute();

  const copyPageAsHtml = (editor: _Editor, title: string) =>
    createEffectHandler(async () => {
      const html = convertMemoToHtml(editor.getJSON(), title);
      await writeHtml(html);
    })
      .withToast('Copied as html.', 'Failed to copy.')
      .execute();

  const copySelectedTextAsMarkdown = (editor: _Editor) =>
    createEffectHandler(async () => {
      const selectedContent = EditorQuery.getSelectedNode(editor);
      const markdown = convertToMarkdown(selectedContent);
      await navigator.clipboard.writeText(markdown);
    })
      .withToast('Copied as markdown.', 'Failed to copy.')
      .execute();

  const copyLinkToHeading = (fullUrl: string, titleWithHeading: string) =>
    createEffectHandler(async () => {
      const htmlLink = createHtmlLink(fullUrl, titleWithHeading);
      await writeHtml(htmlLink);
    })
      .withToast('Copied link to heading.', 'Failed to copy.')
      .execute();

  return {
    copyPageAsMarkdown,
    copyPageAsHtml,
    copySelectedTextAsMarkdown,
    copyLinkToHeading,
  };
}
