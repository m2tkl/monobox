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
import { useWorkspaceCalendarPage } from './useWorkspaceCalendarPage';

import AppButton from '~/app/elements/AppButton.vue';
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
.calendar-page {
  min-width: 0;
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
