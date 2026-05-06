import type { Ref } from 'vue';

import { workspaceKanbansQuery } from '~/features/kanban/queries/workspaceKanbansQuery';
import { memoDetailQuery } from '~/resources/memo/queries';
import { memoLinksQuery } from '~/resources/memo-link/queries';

type UseMemoEditingBootstrapOptions = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  loadKanbanEntries: () => Promise<void>;
  loadTemplates: () => Promise<void>;
};

export function useMemoEditingBootstrap(options: UseMemoEditingBootstrapOptions) {
  const loadInitialData = async () => {
    await Promise.all([
      options.loadTemplates(),
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

    await options.loadKanbanEntries();
  };

  return {
    loadInitialData,
  };
}
