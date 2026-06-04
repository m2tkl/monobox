<template>
  <section
    class="milestone-card"
    :class="{ 'milestone-card--closed': !!milestone.completed_at }"
  >
    <div class="milestone-card-main">
      <AppCheckbox
        :model-value="!!milestone.completed_at"
        :aria-label="`${milestone.completed_at ? 'Reopen' : 'Close'} ${milestone.title}`"
        @update:model-value="$emit('set-completed', milestone.id, $event === true)"
      />
      <input
        :value="milestone.title"
        class="milestone-input milestone-input--title"
        placeholder="Milestone title"
        @change="$emit('update-title', milestone, $event)"
      >
      <input
        :value="milestone.date"
        class="milestone-input milestone-input--date"
        type="date"
        @change="$emit('update-date', milestone, $event)"
      >
      <div class="milestone-card-days">
        {{ daysLabel }}
      </div>
      <AppButton
        size="xs"
        variant="ghost"
        color="neutral"
        class="milestone-state-button"
        @click="$emit('set-completed', milestone.id, !milestone.completed_at)"
      >
        {{ milestone.completed_at ? 'Reopen' : 'Close' }}
      </AppButton>
      <IconButton
        :icon="iconKey.trash"
        :aria-label="`Delete ${milestone.title}`"
        @click="$emit('delete', milestone)"
      />
    </div>

    <div class="milestone-memos">
      <NuxtLink
        v-for="memo in milestone.memos"
        :key="memo.slug_title"
        :to="`/${workspaceSlug}/${memo.slug_title}`"
        class="milestone-memo-chip"
      >
        <span>{{ memo.title }}</span>
        <IconButton
          :icon="iconKey.close"
          aria-label="Remove memo from milestone"
          @click.prevent="$emit('remove-memo', milestone.id, memo.slug_title)"
        />
      </NuxtLink>
    </div>

    <div class="milestone-memo-add">
      <AppSelect
        :model-value="selectedMemoSlug ?? null"
        :items="memoOptions"
        class="milestone-memo-select"
        placeholder="Add linked memo"
        @update:model-value="$emit('select-memo', milestone.id, $event ?? null)"
      />
      <AppButton
        size="xs"
        variant="subtle"
        :disabled="!selectedMemoSlug"
        @click="$emit('add-memo', milestone.id)"
      >
        Link
      </AppButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Milestone } from '~/models/milestone';

import AppButton from '~/app/elements/AppButton.vue';
import AppCheckbox from '~/app/elements/AppCheckbox.vue';
import AppSelect from '~/app/elements/AppSelect.vue';
import IconButton from '~/app/elements/IconButton.vue';
import { iconKey } from '~/utils/icon';

defineProps<{
  milestone: Milestone;
  workspaceSlug: string;
  daysLabel: string;
  memoOptions: { label: string; value: string | number }[];
  selectedMemoSlug?: string | number | null;
}>();

defineEmits<{
  'set-completed': [id: number, completed: boolean];
  'update-title': [milestone: Milestone, event: Event];
  'update-date': [milestone: Milestone, event: Event];
  'delete': [milestone: Milestone];
  'remove-memo': [milestoneId: number, memoSlug: string];
  'select-memo': [milestoneId: number, memoSlug: string | number | null];
  'add-memo': [milestoneId: number];
}>();
</script>

<style scoped>
.milestone-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.milestone-card:hover {
  background: color-mix(in srgb, var(--color-surface) 36%, transparent);
}

.milestone-card:last-child {
  border-bottom: 0;
}

.milestone-card-main {
  display: grid;
  grid-template-columns: 22px minmax(260px, 1fr) 132px 54px 56px 26px;
  gap: 6px;
  align-items: center;
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

.milestone-card-days {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.milestone-card--closed .milestone-input--title {
  color: var(--color-text-secondary);
  text-decoration: line-through;
}

.milestone-state-button {
  justify-content: center;
}

.milestone-memos,
.milestone-memo-add {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 5px;
  padding-left: 28px;
}

.milestone-memo-add {
  display: flex;
  align-items: center;
}

.milestone-memo-add > :first-child {
  flex: 0 1 280px;
}

.milestone-memo-select {
  min-height: 26px;
  font-size: 12px;
}

.milestone-memo-chip {
  display: inline-flex;
  max-width: 260px;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  padding: 1px 4px 1px 7px;
  border: 1px solid var(--color-border-light);
  border-radius: 999px;
  color: var(--color-text-primary);
  font-size: 11px;
}

.milestone-memo-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .milestone-card-main,
  .milestone-memo-add {
    grid-template-columns: 1fr;
  }

  .milestone-memos,
  .milestone-memo-add {
    padding-left: 0;
  }
}
</style>
