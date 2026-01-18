import { computed, ref, watch } from 'vue';

import type { ComputedRef } from 'vue';
import type { KanbanAssignmentItem } from '~/models/kanbanAssignment';

import { command } from '~/external/tauri/command';
import { loadKanbans } from '~/resource-state/resources/kanbanCollection';
import { useKanbanCollectionViewModel } from '~/resource-state/viewmodels/kanbanCollection';
import { iconKey } from '~/utils/icon';

type UseWorkspaceKanbanBoardOptions = {
  workspaceSlug: ComputedRef<string>;
  loadStatuses: (workspaceSlug: string, kanbanId: number) => Promise<unknown>;
  toast: ReturnType<typeof useToast>;
};

export function useWorkspaceKanbanBoard(options: UseWorkspaceKanbanBoardOptions) {
  const kanbanVM = useKanbanCollectionViewModel();
  const kanbans = computed(() => kanbanVM.value.data.items);
  const kanbanOptions = computed(() => kanbans.value.map(kanban => ({
    label: kanban.name,
    value: kanban.id,
  })));

  const selectedKanbanId = ref<number | null>(null);
  const activeKanbanId = computed(() => selectedKanbanId.value);
  const hasKanban = computed(() => activeKanbanId.value !== null);

  const entries = ref<KanbanAssignmentItem[]>([]);
  const isEntriesLoading = ref(false);

  const isCreateKanbanOpen = ref(false);
  const newKanbanName = ref('');
  const isCreatingKanban = ref(false);
  const deleteTargetId = ref<number | null>(null);
  const isDeletingKanban = ref(false);

  const deleteKanbanOpen = computed({
    get: () => deleteTargetId.value !== null,
    set: (open: boolean) => {
      if (!open) {
        deleteTargetId.value = null;
      }
    },
  });

  watch(kanbans, (next) => {
    if (next.length === 0) {
      selectedKanbanId.value = null;
      return;
    }
    if (selectedKanbanId.value === null || !next.some(kanban => kanban.id === selectedKanbanId.value)) {
      selectedKanbanId.value = next[0]?.id ?? null;
    }
  }, { immediate: true });

  const loadEntries = async () => {
    if (!options.workspaceSlug.value || activeKanbanId.value === null) {
      entries.value = [];
      return;
    }

    const currentKanbanId = activeKanbanId.value;
    isEntriesLoading.value = true;
    try {
      const items = await command.kanbanAssignment.listItems({
        workspaceSlugName: options.workspaceSlug.value,
        kanbanId: currentKanbanId,
      });
      if (activeKanbanId.value === currentKanbanId) {
        entries.value = items.map(item => ({ ...item }));
      }
    }
    catch (error) {
      console.error(error);
    }
    finally {
      if (activeKanbanId.value === currentKanbanId) {
        isEntriesLoading.value = false;
      }
    }
  };

  watch([options.workspaceSlug, activeKanbanId], async ([slug, kanbanId]) => {
    if (!slug || kanbanId === null) {
      entries.value = [];
      return;
    }
    await Promise.all([
      options.loadStatuses(slug, kanbanId),
      loadEntries(),
    ]);
  }, { immediate: true });

  const reloadKanbans = async () => {
    if (!options.workspaceSlug.value) return;
    await loadKanbans(options.workspaceSlug.value);
  };

  watch(options.workspaceSlug, async (slug) => {
    if (!slug) return;
    await loadKanbans(slug);
  });

  const openCreateKanban = () => {
    newKanbanName.value = '';
    isCreateKanbanOpen.value = true;
  };

  const createKanban = async () => {
    if (!options.workspaceSlug.value) return;
    if (newKanbanName.value.trim().length === 0) return;

    isCreatingKanban.value = true;
    try {
      const created = await command.kanban.create({
        workspaceSlugName: options.workspaceSlug.value,
        name: newKanbanName.value.trim(),
      });
      selectedKanbanId.value = created.id;
      await reloadKanbans();
      isCreateKanbanOpen.value = false;
    }
    catch (error) {
      console.error(error);
      options.toast.add({
        title: 'Failed to create Kanban.',
        description: 'Please try again.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isCreatingKanban.value = false;
    }
  };

  const openDeleteKanban = () => {
    if (selectedKanbanId.value === null) return;
    deleteTargetId.value = selectedKanbanId.value;
  };

  const deleteKanban = async () => {
    if (!options.workspaceSlug.value) return;
    if (deleteTargetId.value === null) return;

    isDeletingKanban.value = true;
    try {
      await command.kanban.delete({
        workspaceSlugName: options.workspaceSlug.value,
        id: deleteTargetId.value,
      });
      deleteTargetId.value = null;
      await reloadKanbans();
    }
    catch (error) {
      console.error(error);
      options.toast.add({
        title: 'Failed to delete Kanban.',
        description: 'Please try again.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isDeletingKanban.value = false;
    }
  };

  return {
    kanbans,
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
    reloadKanbans,
  };
}
