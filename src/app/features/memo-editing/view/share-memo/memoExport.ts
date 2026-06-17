import { save } from '@tauri-apps/plugin-dialog';

import { buildStandaloneHtmlDocument, convertMemoToHtml, embedImagesAsDataUrls } from './converters';
import { fetchMemo } from '../../resource/read/fetchMemo';

import type { JSONContent, Editor as _Editor } from '@tiptap/vue-3';
import type { Ref } from 'vue';
import type { Link as LinkModel } from '~/models/link';

import { command } from '~/external/tauri/command';

/**
 * Frontend export state and operations for the memo page.
 */
export function useMemoExport(params: {
  workspaceSlug: () => string;
  links: Ref<LinkModel[]>;
  editor: Ref<_Editor | undefined>;
  memoTitle: Ref<string>;
}) {
  const { workspaceSlug, links, editor, memoTitle } = params;
  const toast = useToast();
  const logger = useConsoleLogger('memo-editing/memoExport');

  const exportMode = ref<'idle' | 'selectingTargets'>('idle');
  const htmlExportFileName = computed(() => `${sanitizeFileName(memoTitle.value || 'memo')}.html`);

  const isSelectingTargets = computed({
    get: () => exportMode.value === 'selectingTargets',
    set: (value: boolean) => { exportMode.value = value ? 'selectingTargets' : 'idle'; },
  });

  const exportCandidates = computed(() => {
    const uniqueLinks = Array.from(new Map(links.value.map(link => [link.id, link])).values());
    return uniqueLinks as LinkModel[];
  });

  async function fetchLinkedMemos(targets: LinkModel[]): Promise<Array<{ content: string; title: string }>> {
    const memos: Array<{ content: string; title: string }> = [];
    for (const link of targets) {
      const memo = await fetchMemo({
        workspaceSlug: workspaceSlug(),
        memoSlug: link.slug_title,
      });
      memos.push({ content: memo.content, title: link.title });
    }
    return memos;
  }

  const exportPagesV2 = async (targets: LinkModel[]) => {
    if (!editor.value) return;

    try {
      const currentMemoHtml = convertMemoToHtml(editor.value.getJSON() as JSONContent, memoTitle.value);
      const linkedMemos = await fetchLinkedMemos(targets);
      const linkedMemoHtmls = linkedMemos.map(memo => convertMemoToHtml(JSON.parse(memo.content), memo.title));

      const bodyHtml = await embedImagesAsDataUrls([currentMemoHtml, ...linkedMemoHtmls].join('\n'));
      const html = buildStandaloneHtmlDocument(bodyHtml, memoTitle.value || 'Memo export');
      const path = await save({
        title: 'Export HTML',
        defaultPath: htmlExportFileName.value,
        filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
      });

      if (!path) {
        exportMode.value = 'idle';
        return;
      }

      await command.htmlExport.save({ path, html });
      exportMode.value = 'idle';
      toast.add({ title: 'Exported HTML.', icon: iconKey.success, duration: 1000 });
    }
    catch (error) {
      logger.error(error);
      toast.add({
        title: 'Failed to prepare export.',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      });
    }
  };

  return {
    exportMode,
    isSelectingTargets,
    exportCandidates,
    exportPagesV2,
  };
}

function sanitizeFileName(name: string): string {
  const sanitized = name
    .trim()
    .replaceAll(/[\\/:*?"<>|]/g, '-')
    .replaceAll(/\s+/g, ' ')
    .slice(0, 80);

  return sanitized || 'memo';
}
