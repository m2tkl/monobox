import { convertMemoToHtml } from '../views/export/converters';

import type { JSONContent, Editor as _Editor } from '@tiptap/vue-3';
import type { Ref } from 'vue';
import type { Link as LinkModel } from '~/models/link';

import { command } from '~/external/tauri/command';

/**
 * View-model for preparing memo export with linked memos.
 */
export function useMemoExportViewModel(params: {
  workspaceSlug: () => string;
  links: Ref<LinkModel[]>;
  editor: Ref<_Editor | undefined>;
  memoTitle: Ref<string>;
}) {
  const { workspaceSlug, links, editor, memoTitle } = params;
  const { createEffectHandler } = useEffectHandler();

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
      const memo = await command.memo.get({
        workspaceSlugName: workspaceSlug(),
        memoSlugTitle: link.slug_title,
      });
      memos.push({ content: memo.content, title: link.title });
    }
    return memos;
  }

  const exportPagesV2 = async (targets: LinkModel[]) => {
    if (!editor.value) return;

    await createEffectHandler(async (nextTargets: LinkModel[], editorJson: JSONContent, title: string) => {
      const currentMemoHtml = convertMemoToHtml(editorJson, title);
      const linkedMemos = await fetchLinkedMemos(nextTargets);
      const linkedMemoHtmls = linkedMemos.map(memo => convertMemoToHtml(JSON.parse(memo.content), memo.title));
      return [currentMemoHtml, ...linkedMemoHtmls].join('\n');
    })
      .withToast('Export prepared successfully!', 'Failed to prepare export.')
      .withCallback((result: string) => {
        htmlExport.value = result;
        exportMode.value = 'copyingResult';
      })
      .execute(targets, editor.value.getJSON(), memoTitle.value);
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
