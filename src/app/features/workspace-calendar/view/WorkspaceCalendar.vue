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
          <div
            v-if="viewMode === 'milestones'"
            class="milestone-manager"
          >
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
              <section
                v-for="milestone in filteredMilestones"
                :key="milestone.id"
                class="milestone-card"
                :class="{ 'milestone-card--closed': !!milestone.completed_at }"
              >
                <div class="milestone-card-main">
                  <AppCheckbox
                    :model-value="!!milestone.completed_at"
                    :aria-label="`${milestone.completed_at ? 'Reopen' : 'Close'} ${milestone.title}`"
                    @update:model-value="setMilestoneCompleted(milestone.id, $event === true)"
                  />
                  <input
                    :value="milestone.title"
                    class="milestone-input milestone-input--title"
                    placeholder="Milestone title"
                    @change="updateMilestoneTitle(milestone, $event)"
                  >
                  <input
                    :value="milestone.date"
                    class="milestone-input milestone-input--date"
                    type="date"
                    @change="updateMilestoneDate(milestone, $event)"
                  >
                  <div class="milestone-card-days">
                    {{ getMilestoneDaysLabel(milestone.date, !!milestone.completed_at) }}
                  </div>
                  <AppButton
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    class="milestone-state-button"
                    @click="setMilestoneCompleted(milestone.id, !milestone.completed_at)"
                  >
                    {{ milestone.completed_at ? 'Reopen' : 'Close' }}
                  </AppButton>
                  <IconButton
                    :icon="iconKey.trash"
                    :aria-label="`Delete ${milestone.title}`"
                    @click="openDeleteMilestoneConfirmation(milestone)"
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
                      @click.prevent="removeMilestoneMemo(milestone.id, memo.slug_title)"
                    />
                  </NuxtLink>
                </div>

                <div class="milestone-memo-add">
                  <AppSelect
                    :model-value="selectedMilestoneMemoSlugs[milestone.id] ?? null"
                    :items="getMilestoneMemoOptions(milestone)"
                    class="milestone-memo-select"
                    placeholder="Add linked memo"
                    @update:model-value="value => selectedMilestoneMemoSlugs[milestone.id] = value ?? null"
                  />
                  <AppButton
                    size="xs"
                    variant="subtle"
                    :disabled="!selectedMilestoneMemoSlugs[milestone.id]"
                    @click="addMilestoneMemo(milestone.id)"
                  >
                    Link
                  </AppButton>
                </div>
              </section>
            </div>
          </div>

          <div
            v-else
            class="calendar-table"
          >
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
              <div
                v-if="viewMode === 'working'"
                class="calendar-milestones"
              >
                <button
                  v-for="milestone in getMilestones(day.date)"
                  :key="milestone.id"
                  type="button"
                  class="calendar-milestone"
                  :class="{ 'calendar-milestone--completed': !!milestone.completed_at }"
                  @click="openDay(day.date)"
                >
                  <span class="calendar-milestone-title">{{ milestone.title }}</span>
                  <span class="calendar-milestone-days">{{ getMilestoneDaysLabel(milestone.date, !!milestone.completed_at) }}</span>
                </button>
              </div>
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
import { buildCalendarMonths, countWorkingDaysBetween, getLocalDateString } from '../calendarUtils';
import { loadWorkspaceCalendarData } from '../resource/read/loadWorkspaceCalendarData';
import { useWorkspaceCalendarReadModel } from '../resource/read-model';

import type { CalendarDateRow } from '../calendarUtils';
import type { CalendarDay } from '~/models/calendarDay';
import type { Milestone } from '~/models/milestone';

import AppButton from '~/app/elements/AppButton.vue';
import AppCheckbox from '~/app/elements/AppCheckbox.vue';
import AppSelect from '~/app/elements/AppSelect.vue';
import IconButton from '~/app/elements/IconButton.vue';
import ConfirmModal from '~/app/elements/overlays/ConfirmModal.vue';
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
const milestoneStateFilter = ref<'open' | 'closed'>('open');
const newMilestoneTitle = ref('');
const newMilestoneDate = ref(today);
const selectedMilestoneMemoSlugs = ref<Record<number, string | number | null>>({});
const openMilestoneCount = computed(() => milestones.value.filter(milestone => !milestone.completed_at).length);
const closedMilestoneCount = computed(() => milestones.value.length - openMilestoneCount.value);
const filteredMilestones = computed(() =>
  milestones.value.filter(milestone =>
    milestoneStateFilter.value === 'open' ? !milestone.completed_at : !!milestone.completed_at,
  ),
);
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
const isDeleteMilestoneConfirmationOpen = ref(false);
const isDeletingMilestone = ref(false);
const pendingDeleteMilestone = ref<Milestone | null>(null);
const selectedDay = computed(() => getDay(selectedDate.value));
const deleteMilestoneConfirmationDescription = computed(() => {
  const title = pendingDeleteMilestone.value?.title ?? 'This milestone';
  return `${title} will be deleted permanently. Linked memos will not be deleted.`;
});

await usePageLoader(() => loadWorkspaceCalendarData({ workspaceSlug, year: selectedYear }));

watch(selectedYear, async () => {
  showEarlierDates.value = false;
  await loadWorkspaceCalendarData({ workspaceSlug, year: selectedYear });
});

watch(isDeleteMilestoneConfirmationOpen, (open) => {
  if (!open && !isDeletingMilestone.value) {
    clearDeleteMilestoneConfirmation();
  }
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

const createMilestone = async () => {
  const title = newMilestoneTitle.value.trim();
  if (!title || !newMilestoneDate.value) return;
  try {
    await command.milestone.create({
      workspaceSlugName: workspaceSlug.value,
      date: newMilestoneDate.value,
      title,
    });
    newMilestoneTitle.value = '';
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to create milestone.',
      description: appError.message,
      color: 'error',
    });
  }
};

const updateMilestone = async (milestone: Milestone, value: { date?: string; title?: string }) => {
  const title = (value.title ?? milestone.title).trim();
  const date = value.date ?? milestone.date;
  if (!title || !date) return;
  if (title === milestone.title && date === milestone.date) return;
  try {
    await command.milestone.update({
      workspaceSlugName: workspaceSlug.value,
      id: milestone.id,
      date,
      title,
    });
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to update milestone.',
      description: appError.message,
      color: 'error',
    });
  }
};

const updateMilestoneTitle = async (milestone: Milestone, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  await updateMilestone(milestone, { title: target?.value ?? '' });
};

const updateMilestoneDate = async (milestone: Milestone, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  await updateMilestone(milestone, { date: target?.value ?? '' });
};

const getMilestoneMemoOptions = (milestone: Milestone) => {
  const linkedSlugs = new Set(milestone.memos.map(memo => memo.slug_title));
  return memos.value
    .filter(memo => !linkedSlugs.has(memo.slug_title))
    .map(memo => ({
      label: memo.title,
      value: memo.slug_title,
    }));
};

const addMilestoneMemo = async (milestoneId: number) => {
  const memoSlug = selectedMilestoneMemoSlugs.value[milestoneId];
  if (typeof memoSlug !== 'string' || !memoSlug) return;
  try {
    await command.milestone.addMemo({
      workspaceSlugName: workspaceSlug.value,
      id: milestoneId,
      memoSlugTitle: memoSlug,
    });
    selectedMilestoneMemoSlugs.value = {
      ...selectedMilestoneMemoSlugs.value,
      [milestoneId]: null,
    };
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

const removeMilestoneMemo = async (milestoneId: number, memoSlug: string) => {
  try {
    await command.milestone.removeMemo({
      workspaceSlugName: workspaceSlug.value,
      id: milestoneId,
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

const setMilestoneCompleted = async (id: number, completed: boolean) => {
  try {
    await command.milestone.setCompleted({
      workspaceSlugName: workspaceSlug.value,
      id,
      completed,
    });
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to update milestone.',
      description: appError.message,
      color: 'error',
    });
  }
};

const openDeleteMilestoneConfirmation = (milestone: Milestone) => {
  pendingDeleteMilestone.value = milestone;
  isDeleteMilestoneConfirmationOpen.value = true;
};

const clearDeleteMilestoneConfirmation = () => {
  pendingDeleteMilestone.value = null;
};

const confirmDeleteMilestone = async () => {
  const milestone = pendingDeleteMilestone.value;
  if (!milestone) {
    isDeleteMilestoneConfirmationOpen.value = false;
    return;
  }
  await deleteMilestone(milestone.id);
};

const deleteMilestone = async (id: number) => {
  isDeletingMilestone.value = true;
  try {
    await command.milestone.delete({
      workspaceSlugName: workspaceSlug.value,
      id,
    });
    isDeleteMilestoneConfirmationOpen.value = false;
    pendingDeleteMilestone.value = null;
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to delete milestone.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isDeletingMilestone.value = false;
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

.calendar-row {
  display: grid;
  grid-template-columns: 76px 48px minmax(150px, 0.8fr) minmax(220px, 1.2fr) minmax(180px, 1fr) 32px;
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

.calendar-milestones {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 3px;
}

.calendar-milestone {
  display: inline-flex;
  max-width: 220px;
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

  .milestone-create-card,
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
