import { computed } from 'vue';

import { useWorkspaceKanbanStatusCollectionReadModel } from './read-model';
import { useWorkspaceKanbanBoard } from './useWorkspaceKanbanBoard';
import { useWorkspaceKanbanPageData } from './useWorkspaceKanbanPageData';

import type { ComputedRef } from 'vue';
import type { MemoIndexItem } from '~/models/memo';

import { useWorkspaceMemosReadModel } from '~/features/memo-browsing';
import { workspaceKanbanStatusesQuery } from '~/resources/kanban-status/queries';

type UseWorkspaceKanbanOptions = {
  workspaceSlug: ComputedRef<string>;
  toast: ReturnType<typeof useToast>;
};

export function useWorkspaceKanban(options: UseWorkspaceKanbanOptions) {
  const memosReadModel = useWorkspaceMemosReadModel();
  const memos = computed<MemoIndexItem[]>(() => memosReadModel.value.data.items);

  const {
    kanbanOptions,
    kanbanVM,
    selectedKanbanId,
    activeKanbanId,
    hasKanban,
    entries,
    isEntriesLoading,
    isCreateKanbanOpen,
    newKanbanName,
    isCreatingKanban,
    deleteKanbanOpen,
    isDeletingKanban,
    openCreateKanban,
    createKanban,
    openDeleteKanban,
    deleteKanban,
  } = useWorkspaceKanbanBoard({
    workspaceSlug: options.workspaceSlug,
    loadStatuses: (slug, kanbanId) => workspaceKanbanStatusesQuery.fetch({
      workspaceSlug: slug,
      kanbanId,
    }),
    toast: options.toast,
  });

  const statusReadModel = useWorkspaceKanbanStatusCollectionReadModel(options.workspaceSlug, activeKanbanId);
  const statuses = computed(() => statusReadModel.value.data.items);
  const isLoading = computed(() =>
    memosReadModel.value.flags.isLoading
    || kanbanVM.value.flags.isLoading
    || statusReadModel.value.flags.isLoading
    || isEntriesLoading.value,
  );

  const { loadInitialData } = useWorkspaceKanbanPageData({
    workspaceSlug: options.workspaceSlug,
  });

  return {
    memosReadModel,
    memos,
    kanbanOptions,
    kanbanVM,
    selectedKanbanId,
    activeKanbanId,
    hasKanban,
    entries,
    isEntriesLoading,
    isCreateKanbanOpen,
    newKanbanName,
    isCreatingKanban,
    deleteKanbanOpen,
    isDeletingKanban,
    openCreateKanban,
    createKanban,
    openDeleteKanban,
    deleteKanban,
    statusReadModel,
    statuses,
    isLoading,
    loadInitialData,
  };
}
