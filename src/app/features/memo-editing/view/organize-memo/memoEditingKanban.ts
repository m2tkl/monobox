import { computed } from 'vue';

import { useMemoKanbanAssignments } from './useMemoKanbanAssignments';
import { useMemoEditingKanbanCollectionReadModel } from '../../resource/read-model/kanban';

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
    kanbanSelections,
    isKanbanLoading,
    isKanbanUpdating,
    loadKanbanEntries,
    getStatuses,
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
    kanbanSelections,
    isKanbanLoading,
    isKanbanUpdating,
    loadKanbanEntries,
    getStatuses,
    applyKanbanStatus,
  };
}
