import { computed, reactive, ref, watch } from 'vue';

import { removeMemoKanbanStatus } from '../../resource/command/removeMemoKanbanStatus';
import { upsertMemoKanbanStatus } from '../../resource/command/upsertMemoKanbanStatus';
import {
  loadKanbanStatuses as fetchKanbanStatuses,
} from '../../resource/read/loadKanbanStatuses';
import {
  loadMemoKanbanEntries as fetchMemoKanbanEntries,
} from '../../resource/read/loadMemoKanbanEntries';

import type { useToast } from '#imports';
import type { ComputedRef } from 'vue';
import type { Kanban } from '~/models/kanban';
import type { KanbanAssignmentEntry } from '~/models/kanbanAssignment';
import type { KanbanStatus } from '~/models/kanbanStatus';

import { useResourceManager } from '~/resource-runtime/infra/useResourceManager';
import { workspaceKanbanStatusesQuery } from '~/resources/kanban-status/queries';
import { iconKey } from '~/utils/icon';

type UseMemoKanbanAssignmentsOptions = {
  workspaceSlug: ComputedRef<string>;
  memoSlug: ComputedRef<string>;
  kanbans: ComputedRef<Kanban[]>;
  toast: ReturnType<typeof useToast>;
};

export function useMemoKanbanAssignments(options: UseMemoKanbanAssignmentsOptions) {
  const resourceManager = useResourceManager();
  const kanbanSelections = reactive<Record<number, number | null>>({});
  const updatingKanbans = reactive<Record<number, boolean>>({});
  const isKanbanModalOpen = ref(false);
  const kanbanEntries = ref<KanbanAssignmentEntry[]>([]);
  const isKanbanLoading = ref(false);

  const kanbanEntryMap = computed(() => new Map(kanbanEntries.value.map(entry => [entry.kanban_id, entry])));
  const kanbanEntryCount = computed(() => kanbanEntries.value.length);
  const kanbanIndicatorColor = computed(() => {
    const color = kanbanEntries.value[0]?.kanban_status_color?.trim();
    return color || 'var(--color-surface-muted)';
  });
  const kanbanStatusesById = computed<Record<number, KanbanStatus[]>>(() => {
    const statusMap: Record<number, KanbanStatus[]> = {};
    for (const kanban of options.kanbans.value) {
      const snapshot = resourceManager.getSnapshot<KanbanStatus[]>(
        workspaceKanbanStatusesQuery.key({
          workspaceSlug: options.workspaceSlug.value,
          kanbanId: kanban.id,
        }),
      );
      statusMap[kanban.id] = snapshot.current ?? [];
    }
    return statusMap;
  });

  const isKanbanUpdating = (kanbanId: number) => !!updatingKanbans[kanbanId];

  const syncKanbanSelections = () => {
    for (const kanban of options.kanbans.value) {
      const entry = kanbanEntryMap.value.get(kanban.id);
      kanbanSelections[kanban.id] = entry?.kanban_status_id ?? null;
    }
  };

  const loadKanbanEntries = async () => {
    if (!options.workspaceSlug.value || !options.memoSlug.value) return;
    isKanbanLoading.value = true;
    try {
      kanbanEntries.value = await fetchMemoKanbanEntries({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      });
      syncKanbanSelections();
    }
    finally {
      isKanbanLoading.value = false;
    }
  };

  const loadKanbanStatuses = async () => {
    if (!options.workspaceSlug.value) return;

    await Promise.all(options.kanbans.value.map(async (kanban) => {
      if (kanbanStatusesById.value[kanban.id]?.length) return;
      await fetchKanbanStatuses(options.workspaceSlug.value, kanban.id);
    }));
  };

  const getStatusOptions = (kanbanId: number) => {
    const items = kanbanStatusesById.value[kanbanId] ?? [];
    return [
      { label: 'Not in Kanban', value: null },
      ...items.map(status => ({ label: status.name, value: status.id })),
    ];
  };

  const applyKanbanStatus = async (kanbanId: number, nextStatusId: number | null) => {
    if (!options.workspaceSlug.value || !options.memoSlug.value) return;
    if (isKanbanUpdating(kanbanId)) return;
    if (typeof nextStatusId === 'number' && Number.isNaN(nextStatusId)) return;

    const existing = kanbanEntryMap.value.get(kanbanId) ?? null;
    const previousStatusId = existing?.kanban_status_id ?? null;
    if (nextStatusId === previousStatusId) return;

    updatingKanbans[kanbanId] = true;
    try {
      if (nextStatusId === null) {
        await removeMemoKanbanStatus({
          workspaceSlug: options.workspaceSlug.value,
          memoSlug: options.memoSlug.value,
          kanbanId,
        });
      }
      else {
        await upsertMemoKanbanStatus({
          workspaceSlug: options.workspaceSlug.value,
          memoSlug: options.memoSlug.value,
          kanbanId,
          kanbanStatusId: nextStatusId,
        });
      }
      await loadKanbanEntries();
      syncKanbanSelections();
    }
    catch (error) {
      console.error(error);
      kanbanSelections[kanbanId] = previousStatusId;
      options.toast.add({
        title: 'Failed to update Kanban.',
        description: 'Please try again.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      updatingKanbans[kanbanId] = false;
    }
  };

  const openKanbanModal = () => {
    isKanbanModalOpen.value = true;
  };

  watch(isKanbanModalOpen, async (open) => {
    if (!open) return;
    await loadKanbanStatuses();
    syncKanbanSelections();
  });

  watch(options.kanbans, () => {
    syncKanbanSelections();
    if (isKanbanModalOpen.value) {
      void loadKanbanStatuses();
    }
  });

  watch([options.workspaceSlug, options.memoSlug], async ([slug, memo]) => {
    if (!slug || !memo) return;
    await loadKanbanEntries();
  });

  return {
    kanbanEntries,
    kanbanEntryMap,
    kanbanEntryCount,
    kanbanIndicatorColor,
    kanbanSelections,
    isKanbanLoading,
    isKanbanModalOpen,
    isKanbanUpdating,
    openKanbanModal,
    syncKanbanSelections,
    loadKanbanEntries,
    loadKanbanStatuses,
    getStatusOptions,
    applyKanbanStatus,
  };
}
