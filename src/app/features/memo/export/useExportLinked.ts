import type { JSONContent, Editor as _Editor } from '@tiptap/vue-3';
import type { Ref } from 'vue';
import type { Link as LinkModel } from '~/models/link';

import { command } from '~/external/tauri/command';
import { convertMemoToHtml } from '~/lib/memo/exporter/toHtml';

/**
 * Logic to prepare HTML export with linked memos.
 * Manages small state machine and derived candidates list.
 */
export function useExportLinked(params: {
  workspaceSlug: () => string;
  store: ReturnType<typeof useWorkspaceStore>;
  editor: Ref<_Editor | undefined>;
  memoTitle: Ref<string>;
}) {
  const { workspaceSlug, store, editor, memoTitle } = params;
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
    if (store.links) {
      const uniqueLinks = Array.from(new Map(store.links.map(link => [link.id, link])).values());
      return uniqueLinks;
    }
    return [] as LinkModel[];
  });

  async function fetchLinkedMemos(links: Array<LinkModel>): Promise<Array<{ content: string; title: string }>> {
    const memos: Array<{ content: string; title: string }> = [];
    for (const link of links) {
      const memo = await command.memo.get({
        workspaceSlugName: workspaceSlug(),
        memoSlugTitle: link.slug_title,
      });
      memos.push({ content: memo.content, title: link.title });
    }
    return memos;
  }

  const exportPagesV2 = async (targets: Array<LinkModel>) => {
    if (!editor.value) return;
    await createEffectHandler(async (targets: Array<LinkModel>, editorJson: JSONContent, title: string) => {
      const currentMemoHtml = convertMemoToHtml(editorJson, title);
      const linkedMemos = await fetchLinkedMemos(targets);
      const linkedMemoHtmls = linkedMemos.map(m => convertMemoToHtml(JSON.parse(m.content), m.title));
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
