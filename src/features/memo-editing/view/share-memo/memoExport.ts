import { convertMemoToHtml } from './converters';
import { fetchMemo } from '../../resource/read/fetchMemo';

import type { JSONContent, Editor as _Editor } from '@tiptap/vue-3';
import type { Ref } from 'vue';
import type { Link as LinkModel } from '~/models/link';

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

  const exportMode = ref<'idle' | 'selectingTargets' | 'copyingResult'>('idle');
  const htmlExport = ref<string>('');

  const isSelectingTargets = computed({
    get: () => exportMode.value === 'selectingTargets',
    set: (value: boolean) => { exportMode.value = value ? 'selectingTargets' : 'idle'; },
  });

  const isCopyingResult = computed({
    get: () => exportMode.value === 'copyingResult',
    set: (value: boolean) => { exportMode.value = value ? 'copyingResult' : 'idle'; },
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

      htmlExport.value = [currentMemoHtml, ...linkedMemoHtmls].join('\n');
      exportMode.value = 'copyingResult';
      toast.add({ title: 'Export prepared successfully!', icon: iconKey.success, duration: 1000 });
    }
    catch (error) {
      logger.error(error);
      toast.add({
        title: 'Failed to prepare export.',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      })
    }
  };

  return {
    exportMode,
    htmlExport,
    isSelectingTargets,
    isCopyingResult,
    exportCandidates,
    exportPagesV2,
  };
}
