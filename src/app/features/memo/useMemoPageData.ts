import { ref } from 'vue';

import { memoDetailQuery } from './queries/memoDetailQuery';
import { memoLinksQuery } from './queries/memoLinksQuery';
import { sortMemoTemplates } from './template';

import type { Ref } from 'vue';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';
import { loadKanbans } from '~/resource-state/resources/kanbanCollection';

type UseMemoPageDataOptions = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  loadKanbanEntries: () => Promise<void>;
};

export function useMemoPageData(options: UseMemoPageDataOptions) {
  const availableTemplates = ref<MemoTemplateIndexItem[]>([]);

  const loadInitialData = async () => {
    const [templates] = await Promise.all([
      command.memoTemplate.list({ slugName: options.workspaceSlug.value }),
      memoDetailQuery.fetch({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      }),
      memoLinksQuery.fetch({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      }),
      loadKanbans(options.workspaceSlug.value),
    ]);

    availableTemplates.value = sortMemoTemplates(templates);
    await options.loadKanbanEntries();
  };

  return {
    availableTemplates,
    loadInitialData,
  };
}
