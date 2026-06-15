<template>
  <NuxtLayout name="default">
    <template #main>
      <AppPageFrame>
        <AppPageHeader
          title="Calendar"
          class="calendar-page-header"
        >
          <template #description>
            <span>
              <template v-if="viewMode === 'working'">
                {{ remainingWorkingDays }} working days remaining in {{ selectedYear }}.
              </template>
              <template v-else-if="viewMode === 'settings'">
                Select the dates that should be excluded from the working days view.
              </template>
              <template v-else>
                Create milestones, set dates, and link memos.
              </template>
            </span>
          </template>
        </AppPageHeader>

        <div class="calendar-controls">
          <div
            class="calendar-view-tabs"
            role="tablist"
            aria-label="Calendar day view"
          >
            <button
              type="button"
              class="calendar-view-tab"
              :class="{ 'calendar-view-tab--active': viewMode === 'working' }"
              role="tab"
              :aria-selected="viewMode === 'working'"
              @click="viewMode = 'working'"
            >
              Working days
            </button>
            <button
              type="button"
              class="calendar-view-tab"
              :class="{ 'calendar-view-tab--active': viewMode === 'settings' }"
              role="tab"
              :aria-selected="viewMode === 'settings'"
              @click="viewMode = 'settings'"
            >
              Non-working days
            </button>
          </div>

          <div class="calendar-control-actions">
            <AppButton
              size="sm"
              color="neutral"
              :variant="viewMode === 'milestones' ? 'solid' : 'outline'"
              class="calendar-milestones-button"
              @click="viewMode = 'milestones'"
            >
              Milestones
            </AppButton>
            <AppButton
              v-if="viewMode !== 'milestones' && canToggleEarlierDates"
              size="sm"
              color="neutral"
              variant="ghost"
              class="calendar-earlier-dates-button"
              @click="showEarlierDates = !showEarlierDates"
            >
              {{ showEarlierDates ? 'Hide earlier' : `Earlier (${hiddenEarlierDateCount})` }}
            </AppButton>
            <div class="calendar-year-controls">
              <AppButton
                color="neutral"
                variant="ghost"
                size="sm"
                :icon="iconKey.arrowLeft"
                aria-label="Previous year"
                @click="changeYear(-1)"
              />
              <AppButton
                color="neutral"
                variant="outline"
                size="sm"
                class="calendar-year-button"
                @click="goToCurrentYear"
              >
                {{ selectedYear }}
              </AppButton>
              <AppButton
                color="neutral"
                variant="ghost"
                size="sm"
                :icon="iconKey.arrowRight"
                aria-label="Next year"
                @click="changeYear(1)"
              />
            </div>
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
      </AppPageFrame>
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
import { useWorkspaceCalendarPage } from './useWorkspaceCalendarPage';

import AppButton from '~/app/elements/AppButton.vue';
import AppPageFrame from '~/app/elements/layout/AppPageFrame.vue';
import AppPageHeader from '~/app/elements/layout/AppPageHeader.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
import { SearchPalette } from '~/app/features/search';
import { iconKey } from '~/utils/icon';

const {
  workspaceSlug,
  selectedYear,
  today,
  memos,
  milestones,
  isLoading,
  nonWorkingDates,
  viewMode,
  showEarlierDates,
  visibleDays,
  hiddenEarlierDateCount,
  canToggleEarlierDates,
  remainingWorkingDays,
  selectedDate,
  isDialogOpen,
  isSaving,
  selectedDay,
  getDay,
  getMilestones,
  getMilestoneDaysLabel,
  changeYear,
  goToCurrentYear,
  openDay,
  toggleNonWorking,
  saveSelectedDay,
  addMemo,
  removeMemo,
} = await useWorkspaceCalendarPage();
</script>

<style scoped>
.calendar-page-header {
  min-width: 0;
}

.calendar-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  margin-bottom: 0.625rem;
}

.calendar-view-tabs {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.125rem;
  padding: 0.125rem;
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  background-color: var(--color-surface);
}

.calendar-view-tab {
  display: inline-flex;
  min-height: 1.5rem;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  padding: 0 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1;
  white-space: nowrap;
}

.calendar-view-tab--active {
  border-color: var(--color-border-light);
  background-color: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.calendar-control-actions {
  display: flex;
  min-width: 0;
  flex-shrink: 0;
  align-items: center;
  gap: 0.375rem;
}

.calendar-milestones-button,
.calendar-earlier-dates-button,
.calendar-year-button {
  white-space: nowrap;
}

.calendar-year-controls {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.125rem;
}

.calendar-year {
  min-width: 0;
}

@media (max-width: 900px) {
  .calendar-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .calendar-control-actions {
    justify-content: space-between;
  }
}

@media (max-width: 560px) {
  .calendar-view-tabs {
    width: 100%;
  }

  .calendar-view-tab {
    flex: 1 1 0;
    min-width: 0;
  }

  .calendar-control-actions {
    flex-wrap: wrap;
  }

  .calendar-earlier-dates-button {
    flex: 1 1 auto;
  }
}
</style>
