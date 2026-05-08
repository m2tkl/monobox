import { computed } from 'vue';

import { useMemoEditingKanbanCollectionReadModel } from '../read-model/kanban';
import { useMemoKanbanAssignments } from '../views/kanban/useMemoKanbanAssignments';

import type { ComputedRef } from 'vue';

import { useToast } from '#imports';

type UseMemoEditingKanbanOptions = {
  workspaceSlug: ComputedRef<string>;
  memoSlug: ComputedRef<string>;
};

export function useMemoEditingKanban(options: UseMemoEditingKanbanOptions) {
  const toast = useToast();
  const kanbanReadModel = useMemoEditingKanbanCollectionReadModel(options.workspaceSlug);
  const kanbans = computed(() => kanbanReadModel.value.data.items);

  const {
    kanbanEntryMap,
    kanbanSelections,
    isKanbanLoading,
    isKanbanModalOpen,
    isKanbanUpdating,
    openKanbanModal,
    loadKanbanEntries,
    getStatusOptions,
    applyKanbanStatus,
  } = useMemoKanbanAssignments({
    workspaceSlug: options.workspaceSlug,
    memoSlug: options.memoSlug,
    kanbans,
    toast,
  });

  return {
    kanbanReadModel,
    kanbans,
    kanbanEntryMap,
    kanbanSelections,
    isKanbanLoading,
    isKanbanModalOpen,
    isKanbanUpdating,
    openKanbanModal,
    loadKanbanEntries,
    getStatusOptions,
    applyKanbanStatus,
  };
}
