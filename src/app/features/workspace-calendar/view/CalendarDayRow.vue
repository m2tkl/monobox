<template>
  <div
    class="calendar-row"
    :class="{
      'calendar-row--settings': viewMode === 'settings',
      'calendar-row--today': day.date === today,
      'calendar-row--past': day.date < today,
      'calendar-row--non-working': calendarDay.is_non_working,
      'calendar-row--month-start': day.dayOfMonth === 1,
    }"
  >
    <div class="calendar-date">
      <span class="calendar-date-month">{{ day.monthLabel }}</span>
      <span>{{ day.dayOfMonth }}</span>
    </div>
    <div
      class="calendar-weekday"
      :class="{ 'calendar-weekday--weekend': day.isWeekend }"
    >
      {{ day.weekday }}
    </div>
    <div v-if="viewMode === 'settings'">
      <AppCheckbox
        :model-value="calendarDay.is_non_working"
        :aria-label="`Toggle non-working day for ${day.date}`"
        @update:model-value="$emit('toggle-non-working', day.date, $event)"
      />
    </div>
    <button
      type="button"
      class="calendar-note"
      :class="{ 'calendar-note--placeholder': !calendarDay.note && viewMode === 'working' }"
      :disabled="viewMode === 'settings'"
      @click="$emit('open-day', day.date)"
    >
      {{ calendarDay.note || (viewMode === 'working' ? 'Add note' : '') }}
    </button>
    <div
      v-if="viewMode === 'working'"
      class="calendar-milestones"
    >
      <button
        v-for="milestone in milestones"
        :key="milestone.id"
        type="button"
        class="calendar-milestone"
        :class="{ 'calendar-milestone--completed': !!milestone.completed_at }"
        @click="$emit('open-day', day.date)"
      >
        <span class="calendar-milestone-title">{{ milestone.title }}</span>
        <span class="calendar-milestone-days">
          {{ getMilestoneDaysLabel(milestone.date, !!milestone.completed_at) }}
        </span>
      </button>
    </div>
    <div class="calendar-memos">
      <NuxtLink
        v-for="memo in calendarDay.memos"
        :key="memo.slug_title"
        :to="`/${workspaceSlug}/${memo.slug_title}`"
        class="calendar-memo-link"
      >
        {{ memo.title }}
      </NuxtLink>
    </div>
    <div class="calendar-row-action">
      <IconButton
        :icon="iconKey.edit"
        :aria-label="`Edit ${day.date}`"
        @click="$emit('open-day', day.date)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDateRow } from '../calendarUtils';
import type { CalendarDay } from '~/models/calendarDay';
import type { Milestone } from '~/models/milestone';

import AppCheckbox from '~/app/elements/AppCheckbox.vue';
import IconButton from '~/app/elements/IconButton.vue';
import { iconKey } from '~/utils/icon';

defineProps<{
  day: CalendarDateRow;
  calendarDay: CalendarDay;
  milestones: Milestone[];
  viewMode: 'working' | 'settings';
  today: string;
  workspaceSlug: string;
  getMilestoneDaysLabel: (date: string, completed: boolean) => string;
}>();

defineEmits<{
  'toggle-non-working': [date: string, value: boolean | undefined];
  'open-day': [date: string];
}>();
</script>

<style scoped>
.calendar-row {
  display: grid;
  grid-template-columns: var(--calendar-table-columns);
  align-items: center;
  min-width: var(--calendar-table-min-width);
  min-height: 30px;
  padding: 1px 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.calendar-row--settings {
  grid-template-columns: var(--calendar-table-settings-columns);
}

.calendar-row:last-child {
  border-bottom: 0;
}

.calendar-row:hover {
  background: var(--color-surface-hover);
}

.calendar-row--today {
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.calendar-row--non-working {
  background: color-mix(in srgb, var(--color-primary) 7%, var(--color-surface));
}

.calendar-row--past {
  background: color-mix(in srgb, var(--color-text-muted) 7%, var(--color-surface));
}

.calendar-row--past:hover {
  background: color-mix(in srgb, var(--color-text-muted) 10%, var(--color-surface));
}

.calendar-row--month-start:not(:first-child) {
  border-top: 1px solid var(--color-border-hover);
}

.calendar-date,
.calendar-weekday {
  color: var(--color-text-primary);
  font-size: 12px;
}

.calendar-date {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.calendar-date-month {
  width: 22px;
  color: var(--color-text-muted);
  font-size: 10px;
  text-transform: uppercase;
}

.calendar-weekday--weekend {
  color: var(--color-text-secondary);
}

.calendar-row--past .calendar-date,
.calendar-row--past .calendar-weekday,
.calendar-row--past .calendar-note {
  color: var(--color-text-muted);
}

.calendar-row--past .calendar-milestone,
.calendar-row--past .calendar-memo-link {
  opacity: 0.68;
}

.calendar-note {
  min-width: 0;
  overflow: hidden;
  padding-right: 12px;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-note:disabled {
  cursor: default;
}

.calendar-note--placeholder {
  color: var(--color-text-muted);
  opacity: 0.55;
}

.calendar-note:not(:disabled):empty,
.calendar-note:hover {
  color: var(--color-text-primary);
}

.calendar-memos {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 3px;
}

.calendar-milestones {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 3px;
}

.calendar-milestone {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-primary) 45%, var(--color-border-light));
  border-radius: 999px;
  padding: 1px 6px;
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-primary) 7%, transparent);
  font-size: 11px;
}

.calendar-milestone--completed {
  opacity: 0.55;
}

.calendar-milestone-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-milestone-days {
  flex-shrink: 0;
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 600;
}

.calendar-memo-link {
  max-width: 100%;
  overflow: hidden;
  padding: 1px 6px;
  border: 1px solid var(--color-border-light);
  border-radius: 999px;
  color: var(--color-text-primary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-memo-link:hover {
  border-color: var(--color-border-hover);
  background: var(--color-surface-hover);
}

.calendar-row-action {
  display: flex;
  justify-content: flex-end;
}
</style>
