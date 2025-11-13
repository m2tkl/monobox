import type { Editor as _Editor } from '@tiptap/vue-3';

import { EditorQuery, convertToMarkdown } from '~/app/features/editor';
import { convertMemoToHtml, createHtmlLink } from '~/app/features/memo/export/converters';
import { writeHtml, writeText } from '~/external/tauri/clipboard';

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
