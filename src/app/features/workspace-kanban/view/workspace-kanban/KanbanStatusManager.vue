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

      <div
        v-if="statuses.length > 0"
        class="status-role-panel"
      >
        <label class="status-role-field">
          <span class="status-role-label">Default</span>
          <AppSelect
            :model-value="currentKanban?.default_status_id ?? null"
            :items="statusRoleOptions"
            placeholder="No default status"
            :disabled="isSavingRoles"
            @update:model-value="value => updateStatusRole('default', value)"
          />
        </label>
        <label class="status-role-field">
          <span class="status-role-label">Focus</span>
          <AppSelect
            :model-value="currentKanban?.focus_status_id ?? null"
            :items="statusRoleOptions"
            placeholder="No focus status"
            :disabled="isSavingRoles"
            @update:model-value="value => updateStatusRole('focus', value)"
          />
        </label>
      </div>

      <div
        v-for="(status, index) in statuses"
        :key="status.id"
        class="status-row"
        :class="{ 'status-row--last': index === statuses.length - 1 }"
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
            color="neutral"
            variant="outline"
            icon="carbon:edit"
            @click="openEditDialog(status)"
          >
            Edit
          </AppButton>
          <div class="status-order">
            <AppButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="carbon:chevron-up"
              :disabled="index === 0"
              @click="moveStatus(status.id, 'up')"
            />
            <AppButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="carbon:chevron-down"
              :disabled="index === statuses.length - 1"
              @click="moveStatus(status.id, 'down')"
            />
          </div>
          <AppButton
            size="xs"
            color="error"
            variant="ghost"
            :loading="isDeleting(status.id)"
            @click="requestDeleteStatus(status.id)"
          >
            Delete
          </AppButton>
        </div>
      </div>

      <div class="status-create-action">
        <AppButton
          size="xs"
          color="primary"
          icon="carbon:add"
          @click="openCreateDialog"
        >
          Add status
        </AppButton>
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
            <AppInput
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
              <AppButton
                color="neutral"
                variant="ghost"
                @click="createDialogOpen = false"
              >
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
            <AppInput
              v-model="editName"
              placeholder="Status name"
              size="sm"
            />
            <AppInput
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
              <AppButton
                color="neutral"
                variant="ghost"
                @click="editDialogOpen = false"
              >
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

import {
  createKanbanStatus,
  deleteKanbanStatus,
  reorderKanbanStatuses,
  updateKanbanStatus,
  updateKanbanStatusRoles,
} from '../../resource/command';
import { useWorkspaceKanbanCollectionReadModel, useWorkspaceKanbanStatusCollectionReadModel } from '../../resource/read-model';

import type { KanbanStatus } from '~/models/kanbanStatus';

import AppButton from '~/app/elements/AppButton.vue';
import AppInput from '~/app/elements/AppInput.vue';
import AppSelect from '~/app/elements/AppSelect.vue';
import ConfirmModal from '~/app/elements/overlays/ConfirmModal.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
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

const vm = useWorkspaceKanbanStatusCollectionReadModel(workspaceSlug, kanbanId);
const kanbanVM = useWorkspaceKanbanCollectionReadModel(workspaceSlug);
const statuses = computed(() => vm.value.data.items);
const currentKanban = computed(() => {
  if (kanbanId.value === null) return null;
  return kanbanVM.value.data.items.find(kanban => kanban.id === kanbanId.value) ?? null;
});
const statusRoleOptions = computed(() => statuses.value.map(status => ({
  label: status.name,
  value: status.id,
})));

const saving = reactive<Record<number, boolean>>({});
const deleting = reactive<Record<number, boolean>>({});
const isSavingRoles = ref(false);

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
    await updateKanbanStatus({
      workspaceSlug: workspaceSlug.value,
      kanbanId: kanbanId.value,
      id: targetId,
      name: editName.value.trim(),
      color: normalizeColor(editColor.value),
    });
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
  if (kanbanId.value === null) return;

  deleting[id] = true;
  try {
    await deleteKanbanStatus({
      workspaceSlug: workspaceSlug.value,
      kanbanId: kanbanId.value,
      id,
    });
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

const normalizeRoleValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const id = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(id) ? null : id;
};

const updateStatusRole = async (role: 'default' | 'focus', value: string | number | null | undefined) => {
  if (!workspaceSlug.value) return;
  if (kanbanId.value === null) return;
  if (!currentKanban.value) return;

  const nextStatusId = normalizeRoleValue(value);
  const defaultStatusId = role === 'default'
    ? nextStatusId
    : currentKanban.value.default_status_id ?? null;
  const focusStatusId = role === 'focus'
    ? nextStatusId
    : currentKanban.value.focus_status_id ?? null;

  if (
    defaultStatusId === (currentKanban.value.default_status_id ?? null)
    && focusStatusId === (currentKanban.value.focus_status_id ?? null)
  ) {
    return;
  }

  isSavingRoles.value = true;
  try {
    await updateKanbanStatusRoles({
      workspaceSlug: workspaceSlug.value,
      kanbanId: kanbanId.value,
      defaultStatusId,
      focusStatusId,
    });
    toast.add({
      title: 'Status settings updated.',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to update status settings.',
      description: 'Please try again.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isSavingRoles.value = false;
  }
};

const createStatus = async () => {
  if (!workspaceSlug.value) return;
  if (kanbanId.value === null) return;
  if (newName.value.trim().length === 0) return;

  isCreating.value = true;
  try {
    await createKanbanStatus({
      workspaceSlug: workspaceSlug.value,
      kanbanId: kanbanId.value,
      name: newName.value.trim(),
      color: newColor.value,
    });
    toast.add({
      title: 'Status created.',
      duration: 1000,
      icon: iconKey.success,
    });
    createDialogOpen.value = false;
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
  if (kanbanId.value === null) return;
  const index = statuses.value.findIndex(status => status.id === id);
  if (index === -1) return;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= statuses.value.length) return;

  saving[id] = true;
  try {
    const reorderedStatuses = [...statuses.value];
    const [movedStatus] = reorderedStatuses.splice(index, 1);
    if (!movedStatus) {
      return;
    }
    reorderedStatuses.splice(targetIndex, 0, movedStatus);

    await reorderKanbanStatuses({
      workspaceSlug: workspaceSlug.value,
      kanbanId: kanbanId.value,
      updates: reorderedStatuses.map((status, orderIndex) => ({
        id: status.id,
        orderIndex,
      })),
    });
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
  finally {
    saving[id] = false;
  }
};

const getLabelStyle = (color: string) => {
  if (!color) {
    return {};
  }

  return {
    backgroundColor: `${color}1A`,
    color,
    borderColor: `${color}40`,
  };
};
</script>

<style scoped>
.status-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
}

.status-row--last {
  border-bottom: 0;
}

.status-role-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  border-radius: 8px;
  padding: 12px;
  background-color: color-mix(in srgb, var(--color-card-bg) 58%, transparent);
}

.status-role-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.status-role-label {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.status-label {
  min-width: 0;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-actions,
.status-order {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.status-actions {
  flex-shrink: 0;
}

.status-create-action {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}
</style>
