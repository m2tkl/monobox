import type { Ref } from 'vue';

import { workspaceKanbansQuery } from '~/resources/kanban/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';

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
