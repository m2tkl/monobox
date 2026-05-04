import { workspaceKanbansQuery } from './queries/workspaceKanbansQuery';

import type { Ref } from 'vue';

import { workspaceMemosQuery } from '~/app/features/memo/query/workspaceMemosQuery';

type UseWorkspaceKanbanPageDataOptions = {
  workspaceSlug: Ref<string>;
};

export function useWorkspaceKanbanPageData(options: UseWorkspaceKanbanPageDataOptions) {
  const loadInitialData = async () => {
    if (!options.workspaceSlug.value) {
      return;
    }

    await Promise.all([
      workspaceMemosQuery.fetch({ workspaceSlug: options.workspaceSlug.value }),
      workspaceKanbansQuery.fetch({ workspaceSlug: options.workspaceSlug.value }),
    ]);
  };

  return {
    loadInitialData,
  };
}
