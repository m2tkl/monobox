<template>
  <div class="milestone-manager">
    <div class="milestone-state-tabs">
      <button
        type="button"
        class="milestone-state-tab"
        :class="{ 'milestone-state-tab--active': milestoneStateFilter === 'open' }"
        @click="milestoneStateFilter = 'open'"
      >
        Open
        <span>{{ openMilestoneCount }}</span>
      </button>
      <button
        type="button"
        class="milestone-state-tab"
        :class="{ 'milestone-state-tab--active': milestoneStateFilter === 'closed' }"
        @click="milestoneStateFilter = 'closed'"
      >
        Closed
        <span>{{ closedMilestoneCount }}</span>
      </button>
    </div>

    <div class="milestone-create-card">
      <input
        v-model="newMilestoneTitle"
        class="milestone-input milestone-input--title"
        placeholder="Milestone title"
      >
      <input
        v-model="newMilestoneDate"
        class="milestone-input milestone-input--date"
        type="date"
      >
      <AppButton
        size="xs"
        class="milestone-create-button"
        :disabled="!newMilestoneTitle.trim() || !newMilestoneDate"
        @click="createMilestone"
      >
        Add milestone
      </AppButton>
    </div>

    <div
      v-if="filteredMilestones.length === 0"
      class="calendar-empty"
    >
      No {{ milestoneStateFilter }} milestones in {{ selectedYear }}.
    </div>
    <div
      v-else
      class="milestone-list"
    >
      <MilestoneRow
        v-for="milestone in filteredMilestones"
        :key="milestone.id"
        :milestone="milestone"
        :workspace-slug="workspaceSlug"
        :days-label="getMilestoneDaysLabel(milestone.date, !!milestone.completed_at)"
        :memo-options="getMilestoneMemoOptions(milestone)"
        :selected-memo-slug="selectedMilestoneMemoSlugs[milestone.id] ?? null"
        @set-completed="setMilestoneCompleted"
        @update-title="updateMilestoneTitle"
        @update-date="updateMilestoneDate"
        @delete="openDeleteMilestoneConfirmation"
        @remove-memo="removeMilestoneMemo"
        @select-memo="selectMilestoneMemo"
        @add-memo="addMilestoneMemo"
      />
    </div>

    <ConfirmModal
      v-model:open="isDeleteMilestoneConfirmationOpen"
      title="Delete milestone?"
      :description="deleteMilestoneConfirmationDescription"
      confirm-label="Delete"
      :loading="isDeletingMilestone"
      @confirm="confirmDeleteMilestone"
      @cancel="clearDeleteMilestoneConfirmation"
    />
  </div>
</template>

<script setup lang="ts">
import MilestoneRow from './MilestoneRow.vue';
import { useMilestoneManager } from './useMilestoneManager';

import type { MemoIndexItem } from '~/models/memo';
import type { Milestone } from '~/models/milestone';

import AppButton from '~/app/elements/AppButton.vue';
import ConfirmModal from '~/app/elements/overlays/ConfirmModal.vue';

const props = defineProps<{
  milestones: Milestone[];
  memos: MemoIndexItem[];
  workspaceSlug: string;
  selectedYear: number;
  today: string;
  nonWorkingDates: Set<string>;
}>();

const {
  milestoneStateFilter,
  newMilestoneTitle,
  newMilestoneDate,
  selectedMilestoneMemoSlugs,
  isDeleteMilestoneConfirmationOpen,
  isDeletingMilestone,
  openMilestoneCount,
  closedMilestoneCount,
  filteredMilestones,
  deleteMilestoneConfirmationDescription,
  getMilestoneDaysLabel,
  createMilestone,
  updateMilestoneTitle,
  updateMilestoneDate,
  getMilestoneMemoOptions,
  selectMilestoneMemo,
  addMilestoneMemo,
  removeMilestoneMemo,
  setMilestoneCompleted,
  openDeleteMilestoneConfirmation,
  clearDeleteMilestoneConfirmation,
  confirmDeleteMilestone,
} = useMilestoneManager(props);
</script>

<style scoped>
.milestone-manager {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 980px;
}

.milestone-state-tabs {
  display: flex;
  gap: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-light);
}

.milestone-state-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.milestone-state-tab:hover,
.milestone-state-tab--active {
  color: var(--color-text-primary);
}

.milestone-state-tab span {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 500;
}

.milestone-create-card {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 132px max-content;
  gap: 6px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.milestone-input {
  min-width: 0;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 2px 8px;
  color: var(--color-text-primary);
  background: transparent;
  font-size: 13px;
  line-height: 20px;
}

.milestone-input:hover {
  border-color: var(--color-border-light);
  background: color-mix(in srgb, var(--color-surface) 60%, transparent);
}

.milestone-input:focus {
  border-color: var(--color-primary);
  outline: none;
  background: var(--color-surface);
}

.milestone-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.7;
}

.milestone-input--title {
  font-weight: 600;
}

.milestone-input--date {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.milestone-create-button {
  white-space: nowrap;
}

.milestone-list {
  display: flex;
  flex-direction: column;
}

.calendar-empty {
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 900px) {
  .milestone-create-card {
    grid-template-columns: 1fr;
  }
}
</style>
