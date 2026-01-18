<template>
  <div class="space-y-4">
    <div
      class="text-xs"
      style="color: var(--color-text-secondary)"
    >
      Create and edit statuses used by the Kanban board.
    </div>

    <div
      v-if="!hasKanban"
      class="text-xs"
      style="color: var(--color-text-muted)"
    >
      Select a Kanban to manage statuses.
    </div>

    <LoadingSpinner v-else-if="vm.flags.isLoading" />

    <div
      v-else
      class="status-panel"
    >
      <div
        v-if="statuses.length === 0"
        class="status-empty"
        style="color: var(--color-text-muted)"
      >
        No statuses yet. Add your first status.
      </div>

      <div class="status-row status-row--create">
        <AppButton
          size="xs"
          icon="carbon:add"
          @click="openCreateDialog"
        >
          Add status
        </AppButton>
      </div>

      <div
        v-for="(status, index) in statuses"
        :key="status.id"
        class="status-row"
      >
        <span
          class="status-label"
          :style="getLabelStyle(status.color || '')"
        >
          {{ status.name }}
        </span>
        <div class="status-actions">
          <AppButton
            size="xs"
            icon="carbon:edit"
            @click="openEditDialog(status)"
          >
            Edit
          </AppButton>
          <div class="status-order">
            <AppButton
              size="xs"
              icon="carbon:chevron-up"
              :disabled="index === 0"
              @click="moveStatus(status.id, 'up')"
            />
            <AppButton
              size="xs"
              icon="carbon:chevron-down"
              :disabled="index === statuses.length - 1"
              @click="moveStatus(status.id, 'down')"
            />
          </div>
          <AppButton
            size="xs"
            color="error"
            :loading="isDeleting(status.id)"
            @click="requestDeleteStatus(status.id)"
          >
            Delete
          </AppButton>
        </div>
      </div>
    </div>

    <ConfirmModal
      v-model:open="deleteDialogOpen"
      title="Delete status?"
      description="Deleting a status will unassign it from all memos."
      confirm-label="Delete"
      :loading="deleteTargetId !== null && isDeleting(deleteTargetId)"
      @confirm="confirmDeleteStatus"
    />

    <UModal v-model:open="createDialogOpen">
      <template #content>
        <UCard>
          <div class="space-y-4">
            <div
              class="text-sm font-semibold"
              style="color: var(--color-text-primary)"
            >
              New status
            </div>
            <UInput
              v-model="newName"
              placeholder="Status name"
              size="sm"
            />
            <UColorPicker
              v-model="newColor"
              class="status-color-picker"
            />
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <AppButton @click="createDialogOpen = false">
                Cancel
              </AppButton>
              <AppButton
                color="primary"
                :loading="isCreating"
                :disabled="!canCreate || isCreating"
                @click="createStatus"
              >
                Add
              </AppButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="editDialogOpen">
      <template #content>
        <UCard>
          <div class="space-y-4">
            <div
              class="text-sm font-semibold"
              style="color: var(--color-text-primary)"
            >
              Edit status
            </div>
            <UInput
              v-model="editName"
              placeholder="Status name"
              size="sm"
            />
            <UInput
              v-model="editColor"
              placeholder="#3b82f6"
              size="sm"
            />
            <UColorPicker
              v-model="editColor"
              class="status-color-picker"
            />
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <AppButton @click="editDialogOpen = false">
                Cancel
              </AppButton>
              <AppButton
                color="primary"
                :loading="editTargetId !== null && isSaving(editTargetId)"
                @click="applyEdit"
              >
                Apply
              </AppButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import type { KanbanStatus } from '~/models/kanbanStatus';

import AppButton from '~/app/ui/AppButton.vue';
import ConfirmModal from '~/app/ui/ConfirmModal.vue';
import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import { command } from '~/external/tauri/command';
import { emitEvent } from '~/resource-state/infra/eventBus';
import { useKanbanStatusCollectionViewModel } from '~/resource-state/viewmodels/kanbanStatusCollection';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const props = defineProps<{
  workspaceSlug?: string;
  kanbanId?: number | null;
}>();

const route = useRoute();
const toast = useToast();

const workspaceSlug = computed(() => props.workspaceSlug || getEncodedWorkspaceSlugFromPath(route) || '');
const kanbanId = computed(() => props.kanbanId ?? null);
const hasKanban = computed(() => kanbanId.value !== null);

const vm = useKanbanStatusCollectionViewModel(kanbanId);
const statuses = computed(() => vm.value.data.items);

const saving = reactive<Record<number, boolean>>({});
const deleting = reactive<Record<number, boolean>>({});

const newName = ref('');
const newColor = ref('');
const isCreating = ref(false);

const normalizeColor = (color?: string) => {
  const trimmed = color?.trim();
  return trimmed ?? '';
};

const isSaving = (id: number) => !!saving[id];
const isDeleting = (id: number) => !!deleting[id];

const canCreate = computed(() => newName.value.trim().length > 0);

const createDialogOpen = ref(false);

const openCreateDialog = () => {
  newName.value = '';
  newColor.value = '';
  createDialogOpen.value = true;
};

const editDialogOpen = ref(false);
const editTargetId = ref<number | null>(null);
const editName = ref('');
const editColor = ref('');

const openEditDialog = (status: KanbanStatus) => {
  editTargetId.value = status.id;
  editName.value = status.name;
  editColor.value = status.color ?? '';
  editDialogOpen.value = true;
};

const notifyUpdated = () => {
  if (!workspaceSlug.value) {
    return;
  }
  if (kanbanId.value === null) return;
  emitEvent('kanban-status/updated', { workspaceSlug: workspaceSlug.value, kanbanId: kanbanId.value });
};

const applyEdit = async () => {
  if (!workspaceSlug.value) return;
  if (kanbanId.value === null) return;
  if (editTargetId.value === null) return;
  if (editName.value.trim().length === 0) {
    toast.add({
      title: 'Name is required.',
      color: 'error',
      icon: iconKey.failed,
    });
    return;
  }

  const targetId = editTargetId.value;
  saving[targetId] = true;
  try {
    await command.kanbanStatus.update({
      workspaceSlugName: workspaceSlug.value,
      id: targetId,
      name: editName.value.trim(),
      color: normalizeColor(editColor.value),
    });
    notifyUpdated();
    toast.add({
      title: 'Status updated.',
      duration: 1000,
      icon: iconKey.success,
    });
    editDialogOpen.value = false;
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to update.',
      description: 'Please try again.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    saving[targetId] = false;
  }
};

const deleteStatus = async (id: number) => {
  if (!workspaceSlug.value) return;

  deleting[id] = true;
  try {
    await command.kanbanStatus.delete({
      workspaceSlugName: workspaceSlug.value,
      id,
    });
    notifyUpdated();
    toast.add({
      title: 'Status deleted.',
      description: 'Assignments were cleared.',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to delete.',
      description: 'Please try again.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    deleting[id] = false;
  }
};

const deleteTargetId = ref<number | null>(null);
const deleteDialogOpen = computed({
  get: () => deleteTargetId.value !== null,
  set: (open: boolean) => {
    if (!open) {
      deleteTargetId.value = null;
    }
  },
});

const requestDeleteStatus = (id: number) => {
  deleteTargetId.value = id;
};

const confirmDeleteStatus = async () => {
  if (deleteTargetId.value === null) return;
  await deleteStatus(deleteTargetId.value);
  deleteTargetId.value = null;
};

const createStatus = async () => {
  if (!workspaceSlug.value) return;
  if (newName.value.trim().length === 0) return;

  isCreating.value = true;
  try {
    await command.kanbanStatus.create({
      workspaceSlugName: workspaceSlug.value,
      kanbanId: kanbanId.value,
      name: newName.value.trim(),
      color: newColor.value,
    });
    createDialogOpen.value = false;
    newName.value = '';
    newColor.value = '';
    notifyUpdated();
    toast.add({
      title: 'Status created.',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to create.',
      description: 'Please try again.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isCreating.value = false;
  }
};

const moveStatus = async (id: number, direction: 'up' | 'down') => {
  if (!workspaceSlug.value) return;
  const index = statuses.value.findIndex(status => status.id === id);
  if (index === -1) return;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= statuses.value.length) return;

  const current = statuses.value[index];
  const target = statuses.value[targetIndex];
  if (!current || !target) return;

  try {
    await command.kanbanStatus.updateOrders({
      workspaceSlugName: workspaceSlug.value,
      updates: [
        { id: current.id, orderIndex: target.order_index },
        { id: target.id, orderIndex: current.order_index },
      ],
    });
    notifyUpdated();
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to reorder.',
      description: 'Please try again.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};

const parseHex = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('#')) return null;
  const hex = trimmed.slice(1);
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return { r, g, b };
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

const getLabelStyle = (color: string) => {
  const fallback = {
    backgroundColor: 'var(--color-surface-muted)',
    color: 'var(--color-text-primary)',
  };
  const parsed = parseHex(color || '');
  if (!parsed) return fallback;
  const luminance = (0.2126 * parsed.r + 0.7152 * parsed.g + 0.0722 * parsed.b) / 255;
  return {
    backgroundColor: color,
    color: luminance < 0.6 ? '#ffffff' : '#1f2937',
  };
};
</script>

<style scoped>
.status-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-empty {
  font-size: 12px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  border-radius: 8px;
}

.status-row--create {
  padding-top: 10px;
}

.status-row:hover {
  background-color: var(--color-surface-muted);
}

.status-row--create:hover {
  background-color: transparent;
}

.status-name {
  min-width: 160px;
  flex: 1;
}

.status-color-picker {
  width: 220px;
  height: 220px;
  aspect-ratio: 1 / 1;
}

.status-label {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.status-actions {
  margin-left: auto;
}

.status-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-order {
  display: inline-flex;
  gap: 4px;
}

@media (max-width: 640px) {
  .status-row {
    flex-wrap: wrap;
  }
}
</style>
