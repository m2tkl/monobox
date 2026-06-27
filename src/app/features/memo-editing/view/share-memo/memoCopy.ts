import { save } from '@tauri-apps/plugin-dialog';

import { createHtmlLink, embedEditorJsonImagesAsDataUrls, exportEditorJsonImagesForMarkdown } from './converters';

import type { Editor as _Editor } from '@tiptap/core';

import { EditorQuery, convertToMarkdown } from '~/app/features/editor';
import { writeHtml, writeText } from '~/external/tauri/clipboard';
import { command } from '~/external/tauri/command';

/**
 * Frontend actions for copy operations used on the memo page.
 */
export function useMemoCopy() {
  const logger = useConsoleLogger('memo-editing/memoCopy');

  const copyPageAsMarkdown = async (editor: _Editor, title: string) => {
    try {
      const directoryPath = await selectMarkdownDirectory(sanitizeFileName(title || 'memo'));
      if (!directoryPath) {
        return { ok: true as const, data: undefined, silent: true };
      }
      const json = await exportEditorJsonImagesForMarkdown(editor.getJSON(), directoryPath);
      const markdown = convertToMarkdown(editor.schema.nodeFromJSON(json), title);
      await saveMarkdown(directoryPath, markdown);
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
      const json = await embedEditorJsonImagesAsDataUrls(selectedContent.toJSON());
      const markdown = convertToMarkdown(editor.schema.nodeFromJSON(json));
      await writeText(markdown);
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
    copySelectedTextAsMarkdown,
    copyLinkToHeading,
  };
}

async function selectMarkdownDirectory(defaultFolderName: string): Promise<string | null> {
  return await save({
    title: 'Export Markdown Folder',
    defaultPath: defaultFolderName,
  });
}

async function saveMarkdown(directoryPath: string, markdown: string) {
  await command.textExport.saveMarkdown({ directoryPath, content: markdown });
}

function sanitizeFileName(name: string): string {
  const sanitized = name
    .trim()
    .replaceAll(/[\\/:*?"<>|]/g, '-')
    .replaceAll(/\s+/g, ' ')
    .slice(0, 80);

  return sanitized || 'memo';
}
