import { computed, reactive, ref, watch } from 'vue';

import type { ComputedRef } from 'vue';
import type { Kanban } from '~/models/kanban';
import type { KanbanAssignmentEntry } from '~/models/kanbanAssignment';
import type { KanbanStatus } from '~/models/kanbanStatus';

import { command } from '~/external/tauri/command';
import { iconKey } from '~/utils/icon';

type UseMemoKanbanAssignmentsOptions = {
  workspaceSlug: ComputedRef<string>;
  memoSlug: ComputedRef<string>;
  kanbans: ComputedRef<Kanban[]>;
  toast: ReturnType<typeof useToast>;
};

export function useMemoKanbanAssignments(options: UseMemoKanbanAssignmentsOptions) {
  const kanbanEntries = ref<KanbanAssignmentEntry[]>([]);
  const kanbanSelections = reactive<Record<number, number | null>>({});
  const kanbanStatuses = ref<Record<number, KanbanStatus[]>>({});
  const updatingKanbans = reactive<Record<number, boolean>>({});
  const isKanbanModalOpen = ref(false);
  const isKanbanLoading = ref(false);

  const kanbanEntryMap = computed(() => new Map(kanbanEntries.value.map(entry => [entry.kanban_id, entry])));
  const kanbanEntryCount = computed(() => kanbanEntries.value.length);
  const kanbanIndicatorColor = computed(() => {
    const color = kanbanEntries.value[0]?.kanban_status_color?.trim();
    return color || 'var(--color-surface-muted)';
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
      kanbanEntries.value = await command.kanbanAssignment.listEntries({
        workspaceSlugName: options.workspaceSlug.value,
        memoSlugTitle: options.memoSlug.value,
      });
      syncKanbanSelections();
    }
    catch (error) {
      console.error(error);
    }
    finally {
      isKanbanLoading.value = false;
    }
  };

  const loadKanbanStatuses = async () => {
    if (!options.workspaceSlug.value) return;
    const statusMap = { ...kanbanStatuses.value };

    await Promise.all(options.kanbans.value.map(async (kanban) => {
      if (statusMap[kanban.id]) return;
      const statuses = await command.kanbanStatus.list({
        slugName: options.workspaceSlug.value,
        kanbanId: kanban.id,
      });
      statusMap[kanban.id] = statuses;
    }));

    kanbanStatuses.value = statusMap;
  };

  const getStatusOptions = (kanbanId: number) => {
    const items = kanbanStatuses.value[kanbanId] ?? [];
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
        await command.kanbanAssignment.remove({
          workspaceSlugName: options.workspaceSlug.value,
          memoSlugTitle: options.memoSlug.value,
          kanbanId,
        });
        kanbanEntries.value = kanbanEntries.value.filter(entry => entry.kanban_id !== kanbanId);
      }
      else {
        await command.kanbanAssignment.upsertStatus({
          workspaceSlugName: options.workspaceSlug.value,
          memoSlugTitle: options.memoSlug.value,
          kanbanId,
          kanbanStatusId: nextStatusId,
          position: null,
        });
        const status = (kanbanStatuses.value[kanbanId] ?? []).find(item => item.id === nextStatusId);
        if (existing) {
          existing.kanban_status_id = nextStatusId;
          existing.kanban_status_name = status?.name ?? null;
          existing.kanban_status_color = status?.color ?? null;
        }
        else {
          const kanban = options.kanbans.value.find(item => item.id === kanbanId);
          kanbanEntries.value.push({
            kanban_id: kanbanId,
            kanban_name: kanban?.name ?? 'Kanban',
            kanban_status_id: nextStatusId,
            kanban_status_name: status?.name ?? null,
            kanban_status_color: status?.color ?? null,
            position: null,
          });
        }
      }
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
    kanbanStatuses,
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
