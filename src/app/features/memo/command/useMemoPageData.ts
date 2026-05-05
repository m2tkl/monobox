import { ref } from 'vue';

import type { Ref } from 'vue';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { workspaceKanbansQuery } from '~/app/features/kanban/queries/workspaceKanbansQuery';
import { memoDetailQuery } from '~/app/features/memo/query/memoDetailQuery';
import { memoLinksQuery } from '~/app/features/memo/query/memoLinksQuery';
import { sortMemoTemplates } from '~/app/features/memo/view/template/template';
import { command } from '~/external/tauri/command';

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
