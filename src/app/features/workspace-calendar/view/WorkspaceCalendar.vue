<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="calendar-page">
        <div class="calendar-toolbar">
          <div>
            <h1 class="calendar-title">
              Calendar
            </h1>
            <p class="calendar-subtitle">
              <template v-if="viewMode === 'working'">
                {{ remainingWorkingDays }} working days remaining in {{ selectedYear }}.
              </template>
              <template v-else>
                Select the dates that should be excluded from the working days view.
              </template>
            </p>
          </div>

          <div class="calendar-toolbar-actions">
            <AppButton
              v-if="canToggleEarlierDates"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="showEarlierDates = !showEarlierDates"
            >
              {{ showEarlierDates ? 'Hide earlier dates' : `Show earlier dates (${hiddenEarlierDateCount})` }}
            </AppButton>
            <div class="calendar-view-switch">
              <AppButton
                size="sm"
                color="neutral"
                :variant="viewMode === 'working' ? 'solid' : 'ghost'"
                @click="viewMode = 'working'"
              >
                Working days
              </AppButton>
              <AppButton
                size="sm"
                color="neutral"
                :variant="viewMode === 'settings' ? 'solid' : 'ghost'"
                @click="viewMode = 'settings'"
              >
                Non-working day settings
              </AppButton>
            </div>
            <AppButton
              color="neutral"
              variant="ghost"
              :icon="iconKey.arrowLeft"
              aria-label="Previous year"
              @click="changeYear(-1)"
            />
            <AppButton
              color="neutral"
              variant="outline"
              @click="goToCurrentYear"
            >
              {{ selectedYear }}
            </AppButton>
            <AppButton
              color="neutral"
              variant="ghost"
              :icon="iconKey.arrowRight"
              aria-label="Next year"
              @click="changeYear(1)"
            />
          </div>
        </div>

        <LoadingSpinner v-if="isLoading" />

        <div
          v-else
          class="calendar-year"
        >
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
              <div>Linked memos</div>
              <div v-if="viewMode === 'working'" />
            </div>

            <div
              v-for="day in visibleDays"
              :key="day.date"
              class="calendar-row"
              :class="{
                'calendar-row--settings': viewMode === 'settings',
                'calendar-row--today': day.date === today,
                'calendar-row--non-working': getDay(day.date).is_non_working,
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
                  :model-value="getDay(day.date).is_non_working"
                  :aria-label="`Toggle non-working day for ${day.date}`"
                  @update:model-value="toggleNonWorking(day.date, $event)"
                />
              </div>
              <button
                type="button"
                class="calendar-note"
                :class="{ 'calendar-note--placeholder': !getDay(day.date).note && viewMode === 'working' }"
                :disabled="viewMode === 'settings'"
                @click="openDay(day.date)"
              >
                {{ getDay(day.date).note || (viewMode === 'working' ? 'Add note' : '') }}
              </button>
              <div class="calendar-memos">
                <NuxtLink
                  v-for="memo in getDay(day.date).memos"
                  :key="memo.slug_title"
                  :to="`/${workspaceSlug}/${memo.slug_title}`"
                  class="calendar-memo-link"
                >
                  {{ memo.title }}
                </NuxtLink>
              </div>
              <div
                v-if="viewMode === 'working'"
                class="calendar-row-action"
              >
                <IconButton
                  :icon="iconKey.edit"
                  :aria-label="`Edit ${day.date}`"
                  @click="openDay(day.date)"
                />
              </div>
            </div>

            <div
              v-if="visibleDays.length === 0"
              class="calendar-empty"
            >
              No working days in {{ selectedYear }}.
            </div>
          </div>
        </div>

        <CalendarDayDialog
          v-model:open="isDialogOpen"
          :date="selectedDate"
          :workspace-slug="workspaceSlug"
          :note="selectedDay.note"
          :linked-memos="selectedDay.memos"
          :memos="memos"
          :saving="isSaving"
          @save="saveSelectedDay"
          @add-memo="addMemo"
          @remove-memo="removeMemo"
        />
      </div>
    </template>

    <template #actions>
      <SearchPalette
        v-if="memos.length > 0"
        :workspace-slug="workspaceSlug"
        :memos="memos"
        type="search"
        shortcut-symbol="k"
      />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import CalendarDayDialog from './CalendarDayDialog.vue';
import { buildCalendarMonths, getLocalDateString } from '../calendarUtils';
import { loadWorkspaceCalendarData } from '../resource/read/loadWorkspaceCalendarData';
import { useWorkspaceCalendarReadModel } from '../resource/read-model';

import type { CalendarDateRow } from '../calendarUtils';
import type { CalendarDay } from '~/models/calendarDay';

import AppButton from '~/app/elements/AppButton.vue';
import AppCheckbox from '~/app/elements/AppCheckbox.vue';
import IconButton from '~/app/elements/IconButton.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
import { SearchPalette } from '~/app/features/search';
import { command } from '~/resources/command';
import { handleError } from '~/utils/error';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const emptyDay = (date: string): CalendarDay => ({
  id: 0,
  date,
  note: null,
  is_non_working: false,
  memos: [],
});

const route = useRoute();
const toast = useToast();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const currentYear = new Date().getFullYear();
const selectedYearValue = ref(currentYear);
const selectedYear = computed(() => selectedYearValue.value);
const today = getLocalDateString();
const oneWeekBeforeToday = getLocalDateString(new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  new Date().getDate() - 7,
));
const months = computed(() => buildCalendarMonths(selectedYear.value));
const allDateRows = computed<CalendarDateRow[]>(() => months.value.flatMap(month => month.days));
const readModel = useWorkspaceCalendarReadModel(workspaceSlug, selectedYear);
const days = computed(() => readModel.value.data.days);
const memos = computed(() => readModel.value.data.memos);
const isLoading = computed(() => readModel.value.flags.isLoading);
const dayMap = computed(() => new Map(days.value.map(day => [day.date, day])));
const viewMode = ref<'working' | 'settings'>('working');
const showEarlierDates = ref(false);
const dateRowsFromDefaultStart = computed(() => {
  if (selectedYear.value !== currentYear || showEarlierDates.value) {
    return allDateRows.value;
  }
  return allDateRows.value.filter(day => day.date >= oneWeekBeforeToday);
});
const visibleDays = computed(() => {
  if (viewMode.value === 'settings') {
    return dateRowsFromDefaultStart.value;
  }
  return dateRowsFromDefaultStart.value.filter(day => !getDay(day.date).is_non_working);
});
const hiddenEarlierDateCount = computed(() => allDateRows.value.length - dateRowsFromDefaultStart.value.length);
const canToggleEarlierDates = computed(() =>
  selectedYear.value === currentYear && (showEarlierDates.value || hiddenEarlierDateCount.value > 0),
);
const remainingWorkingDays = computed(() =>
  allDateRows.value.filter(day => day.date >= today && !getDay(day.date).is_non_working).length,
);

const selectedDate = ref(today);
const isDialogOpen = ref(false);
const isSaving = ref(false);
const selectedDay = computed(() => getDay(selectedDate.value));

await usePageLoader(() => loadWorkspaceCalendarData({ workspaceSlug, year: selectedYear }));

watch(selectedYear, async () => {
  showEarlierDates.value = false;
  await loadWorkspaceCalendarData({ workspaceSlug, year: selectedYear });
});

const getDay = (date: string) => dayMap.value.get(date) ?? emptyDay(date);

const changeYear = (offset: number) => {
  selectedYearValue.value += offset;
};

const goToCurrentYear = () => {
  selectedYearValue.value = currentYear;
};

const openDay = (date: string) => {
  selectedDate.value = date;
  isDialogOpen.value = true;
};

const toggleNonWorking = async (date: string, value: boolean | undefined) => {
  const day = getDay(date);
  await updateDay(date, day.note, value === true);
};

const saveSelectedDay = async (value: { note: string | null }) => {
  isSaving.value = true;
  try {
    await updateDay(selectedDate.value, value.note, selectedDay.value.is_non_working);
    isDialogOpen.value = false;
  }
  finally {
    isSaving.value = false;
  }
};

const updateDay = async (date: string, note: string | null | undefined, isNonWorking: boolean) => {
  try {
    await command.calendarDay.update({
      workspaceSlugName: workspaceSlug.value,
      date,
      note,
      isNonWorking,
    });
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to update calendar day.',
      description: appError.message,
      color: 'error',
    });
  }
};

const addMemo = async (memoSlug: string) => {
  try {
    await command.calendarDay.addMemo({
      workspaceSlugName: workspaceSlug.value,
      date: selectedDate.value,
      memoSlugTitle: memoSlug,
    });
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to link memo.',
      description: appError.message,
      color: 'error',
    });
  }
};

const removeMemo = async (memoSlug: string) => {
  try {
    await command.calendarDay.removeMemo({
      workspaceSlugName: workspaceSlug.value,
      date: selectedDate.value,
      memoSlugTitle: memoSlug,
    });
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to unlink memo.',
      description: appError.message,
      color: 'error',
    });
  }
};
</script>

<style scoped>
.calendar-page {
  min-height: 100%;
  padding: 24px;
}

.calendar-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.calendar-title {
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: 700;
}

.calendar-subtitle {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.calendar-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-view-switch {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}

.calendar-year {
  min-width: 0;
}

.calendar-table {
  min-width: 0;
  overflow-x: auto;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface);
}

.calendar-table-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 76px 48px minmax(180px, 1fr) minmax(220px, 1.2fr) 32px;
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

.calendar-row {
  display: grid;
  grid-template-columns: 76px 48px minmax(180px, 1fr) minmax(220px, 1.2fr) 32px;
  align-items: center;
  min-width: 680px;
  min-height: 30px;
  padding: 1px 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.calendar-row--settings {
  grid-template-columns: 76px 48px 100px minmax(180px, 1fr) minmax(220px, 1.2fr);
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
  width: 24px;
  color: var(--color-text-muted);
  font-size: 10px;
  text-transform: uppercase;
}

.calendar-weekday--weekend {
  color: var(--color-text-secondary);
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

.calendar-memo-link {
  max-width: 180px;
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

.calendar-empty {
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 900px) {
  .calendar-toolbar {
    flex-direction: column;
  }

  .calendar-toolbar-actions {
    flex-wrap: wrap;
  }
}
</style>
