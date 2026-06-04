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
              <template v-else-if="viewMode === 'settings'">
                Select the dates that should be excluded from the working days view.
              </template>
              <template v-else>
                Create milestones, set dates, and link memos.
              </template>
            </p>
          </div>

          <div class="calendar-toolbar-actions">
            <AppButton
              v-if="viewMode !== 'milestones' && canToggleEarlierDates"
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
              size="sm"
              color="neutral"
              :variant="viewMode === 'milestones' ? 'solid' : 'outline'"
              @click="viewMode = 'milestones'"
            >
              Milestones
            </AppButton>
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
          <MilestoneManager
            v-if="viewMode === 'milestones'"
            :milestones="milestones"
            :memos="memos"
            :workspace-slug="workspaceSlug"
            :selected-year="selectedYear"
            :today="today"
            :non-working-dates="nonWorkingDates"
          />

          <CalendarDayTable
            v-else
            :visible-days="visibleDays"
            :view-mode="viewMode"
            :selected-year="selectedYear"
            :today="today"
            :workspace-slug="workspaceSlug"
            :get-day="getDay"
            :get-milestones="getMilestones"
            :get-milestone-days-label="getMilestoneDaysLabel"
            @toggle-non-working="toggleNonWorking"
            @open-day="openDay"
          />
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
import CalendarDayTable from './CalendarDayTable.vue';
import MilestoneManager from './MilestoneManager.vue';
import { buildCalendarMonths, countWorkingDaysBetween, getLocalDateString } from '../calendarUtils';
import { loadWorkspaceCalendarData } from '../resource/read/loadWorkspaceCalendarData';
import { useWorkspaceCalendarReadModel } from '../resource/read-model';

import type { CalendarDateRow } from '../calendarUtils';
import type { CalendarDay } from '~/models/calendarDay';
import type { Milestone } from '~/models/milestone';

import AppButton from '~/app/elements/AppButton.vue';
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
const milestones = computed(() => readModel.value.data.milestones);
const isLoading = computed(() => readModel.value.flags.isLoading);
const dayMap = computed(() => new Map(days.value.map(day => [day.date, day])));
const milestoneMap = computed(() => {
  const map = new Map<string, Milestone[]>();
  for (const milestone of milestones.value) {
    const items = map.get(milestone.date) ?? [];
    items.push(milestone);
    map.set(milestone.date, items);
  }
  return map;
});
const nonWorkingDates = computed(() => new Set(days.value.filter(day => day.is_non_working).map(day => day.date)));
const viewMode = ref<'working' | 'settings' | 'milestones'>('working');
const showEarlierDates = ref(false);
const dateRowsFromDefaultStart = computed(() => {
  if (selectedYear.value !== currentYear || showEarlierDates.value) {
    return allDateRows.value;
  }
  return allDateRows.value.filter(day =>
    day.date >= oneWeekBeforeToday
    || getMilestones(day.date).some(milestone => !milestone.completed_at),
  );
});
const visibleDays = computed(() => {
  if (viewMode.value === 'settings') {
    return dateRowsFromDefaultStart.value;
  }
  return dateRowsFromDefaultStart.value.filter(day =>
    !getDay(day.date).is_non_working || getMilestones(day.date).length > 0,
  );
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
const getMilestones = (date: string) => milestoneMap.value.get(date) ?? [];
const getMilestoneDaysLabel = (date: string, completed: boolean) => {
  if (completed) return 'Done';
  const daysRemaining = countWorkingDaysBetween(today, date, nonWorkingDates.value);
  if (daysRemaining === 0) return 'Today';
  if (daysRemaining > 0) return `${daysRemaining}d`;
  return `${Math.abs(daysRemaining)}d overdue`;
};

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

@media (max-width: 900px) {
  .calendar-toolbar {
    flex-direction: column;
  }

  .calendar-toolbar-actions {
    flex-wrap: wrap;
  }
}
</style>
