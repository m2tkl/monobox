<template>
  <div class="calendar-table">
    <div
      class="calendar-table-header"
      :class="{ 'calendar-table-header--settings': viewMode === 'settings' }"
    >
      <div>Date</div>
      <div>Day</div>
      <template v-if="viewMode === 'settings'">
        <div>Non-working</div>
      </template>
      <div>Note</div>
      <div v-if="viewMode === 'working'">
        Milestones
      </div>
      <div>Linked memos</div>
      <div v-if="viewMode === 'working'" />
    </div>

    <CalendarDayRow
      v-for="day in visibleDays"
      :key="day.date"
      :day="day"
      :calendar-day="getDay(day.date)"
      :milestones="getMilestones(day.date)"
      :view-mode="viewMode"
      :today="today"
      :workspace-slug="workspaceSlug"
      :get-milestone-days-label="getMilestoneDaysLabel"
      @toggle-non-working="(date, value) => $emit('toggle-non-working', date, value)"
      @open-day="$emit('open-day', $event)"
    />

    <div
      v-if="visibleDays.length === 0"
      class="calendar-empty"
    >
      No working days in {{ selectedYear }}.
    </div>
  </div>
</template>

<script setup lang="ts">
import CalendarDayRow from './CalendarDayRow.vue';

import type { CalendarDateRow } from '../calendarUtils';
import type { CalendarDay } from '~/models/calendarDay';
import type { Milestone } from '~/models/milestone';

defineProps<{
  visibleDays: CalendarDateRow[];
  viewMode: 'working' | 'settings';
  selectedYear: number;
  today: string;
  workspaceSlug: string;
  getDay: (date: string) => CalendarDay;
  getMilestones: (date: string) => Milestone[];
  getMilestoneDaysLabel: (date: string, completed: boolean) => string;
}>();

defineEmits<{
  'toggle-non-working': [date: string, value: boolean | undefined];
  'open-day': [date: string];
}>();
</script>

<style scoped>
.calendar-table {
  min-width: 0;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface);
}

.calendar-table-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 76px 48px minmax(150px, 0.8fr) minmax(220px, 1.2fr) minmax(180px, 1fr) 32px;
  align-items: center;
  min-width: 680px;
  padding: 5px 8px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.calendar-table-header--settings {
  grid-template-columns: 76px 48px 100px minmax(180px, 1fr) minmax(220px, 1.2fr);
}

.calendar-empty {
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 760px) {
  .calendar-table {
    overflow-x: auto;
  }
}
</style>
