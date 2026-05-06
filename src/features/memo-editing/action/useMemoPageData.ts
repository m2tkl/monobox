import { ref } from 'vue';

import type { Ref } from 'vue';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';
import { workspaceKanbansQuery } from '~/features/kanban/queries/workspaceKanbansQuery';
import { sortMemoTemplates } from '~/features/memo-editing/view/template/template';
import { memoDetailQuery } from '~/resources/memo/queries';
import { memoLinksQuery } from '~/resources/memo-link/queries';

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
      workspaceKanbansQuery.fetch({ workspaceSlug: options.workspaceSlug.value }),
    ]);

    availableTemplates.value = sortMemoTemplates(templates);
    await options.loadKanbanEntries();
  };

  return {
    availableTemplates,
    loadInitialData,
  };
}
