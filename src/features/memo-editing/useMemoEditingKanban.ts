import { computed } from 'vue';

import type { ComputedRef } from 'vue';

import { useToast } from '#imports';
import { useKanbanCollectionReadModel } from '~/features/kanban/read-model';
import { useMemoKanbanAssignments } from '~/features/memo-editing/view/kanban/useMemoKanbanAssignments';

type UseMemoEditingKanbanOptions = {
  workspaceSlug: ComputedRef<string>;
  memoSlug: ComputedRef<string>;
};

export function useMemoEditingKanban(options: UseMemoEditingKanbanOptions) {
  const toast = useToast();
  const kanbanReadModel = useKanbanCollectionReadModel();
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
