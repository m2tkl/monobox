import type { Ref } from 'vue';

import { workspaceKanbansQuery } from '~/resources/kanban/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';

type LoadWorkspaceKanbanDataOptions = {
  workspaceSlug: Ref<string>;
};

export async function loadWorkspaceKanbanData(options: LoadWorkspaceKanbanDataOptions) {
  if (!options.workspaceSlug.value) {
    return;
  }

  await Promise.all([
    workspaceMemosQuery.fetch({ workspaceSlug: options.workspaceSlug.value }),
    workspaceKanbansQuery.fetch({ workspaceSlug: options.workspaceSlug.value }),
  ]);
}
