<template>
  <AppDialog
    v-model:open="open"
    title="Status"
  >
    <div
      v-if="kanbans.length === 0"
      class="status-assignment-empty"
    >
      No statuses available.
    </div>

    <div
      v-else
      class="status-assignment-list"
    >
      <div
        v-for="kanban in kanbans"
        :key="kanban.id"
        class="status-assignment-row"
      >
        <div class="status-assignment-actions">
          <div class="status-choice-list">
            <AppButton
              v-for="status in getStatuses(kanban.id)"
              :key="status.id"
              size="sm"
              :color="selections[kanban.id] === status.id ? 'primary' : 'neutral'"
              :variant="selections[kanban.id] === status.id ? 'solid' : 'outline'"
              :disabled="isUpdating(kanban.id)"
              class="status-choice"
              @click="applyStatus(kanban.id, status.id)"
            >
              {{ status.name }}
            </AppButton>
          </div>

          <div class="status-remove-action">
            <AppButton
              size="xs"
              color="error"
              variant="ghost"
              :icon="iconKey.close"
              :disabled="isUpdating(kanban.id) || !entryMap.get(kanban.id)"
              @click="applyStatus(kanban.id, null)"
            >
              Remove status assignment
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import type { Kanban } from '~/models/kanban';
import type { KanbanAssignmentEntry } from '~/models/kanbanAssignment';
import type { KanbanStatus } from '~/models/kanbanStatus';

import AppButton from '~/app/elements/AppButton.vue';
import AppDialog from '~/app/elements/overlays/AppDialog.vue';
import { iconKey } from '~/utils/icon';

defineProps<{
  kanbans: Kanban[];
  entryMap: Map<number, KanbanAssignmentEntry>;
  selections: Record<number, number | null>;
  isUpdating: (kanbanId: number) => boolean;
  getStatuses: (kanbanId: number) => KanbanStatus[];
  applyStatus: (kanbanId: number, statusId: number | null) => void | Promise<void>;
}>();

const open = defineModel<boolean>('open', { required: true });
</script>

<style scoped>
.status-assignment-empty {
  font-size: 12px;
  color: var(--color-text-muted);
}

.status-assignment-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-assignment-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-assignment-actions {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
}

.status-choice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-choice {
  width: 100%;
  justify-content: flex-start;
}

.status-remove-action {
  width: 100%;
  border-top: 1px solid var(--color-border-light);
  padding-top: 10px;
  text-align: left;
}
</style>
