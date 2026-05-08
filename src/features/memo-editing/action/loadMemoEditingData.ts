import type { Ref } from 'vue';

import { workspaceKanbansQuery } from '~/resources/kanban/queries';
import { memoDetailQuery } from '~/resources/memo/queries';
import { memoLinksQuery } from '~/resources/memo-link/queries';

type LoadMemoEditingDataOptions = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  loadKanbanEntries: () => Promise<void>;
  loadTemplates: () => Promise<void>;
};

export async function loadMemoEditingData(options: LoadMemoEditingDataOptions) {
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
}
