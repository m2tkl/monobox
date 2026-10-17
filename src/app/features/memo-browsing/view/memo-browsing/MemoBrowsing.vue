<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="size-full">
        <AppPageFrame
          fill
          inner-class="size-full overflow-y-auto pb-4"
        >
          <LoadingSpinner v-if="isLoading" />
          <div
            v-else-if="recentMemos.length === 0"
            class="flex h-full items-center justify-center text-center"
            style="color: var(--color-text-secondary)"
          >
            {{ emptyLabel }}
          </div>

          <template v-else>
            <div class="memo-browsing-header">
              <AppPageHeader
                :title="headingLabel"
                :icon="headingIcon"
                :heading-level="2"
              />
            </div>

            <template v-if="isFocusFilter">
              <MemoCards
                v-if="limitedActiveFocusMemos.length > 0"
                :memos="limitedActiveFocusMemos"
                :bookmarked-memo-ids="bookmarkedMemoIds"
                show-done-for-today
                :done-for-today-memo-slugs="doneTodayMemoSlugs"
                :pending-done-for-today-memo-slugs="pendingDoneForTodayMemoSlugs"
                @done-for-today="markDoneForToday"
                @undo-done-for-today="clearDoneForToday"
              />

              <section
                v-if="limitedDoneTodayFocusMemos.length > 0"
                class="memo-browsing-done-section"
              >
                <h3 class="memo-browsing-done-heading">
                  Done for today
                </h3>
                <MemoCards
                  :memos="limitedDoneTodayFocusMemos"
                  :bookmarked-memo-ids="bookmarkedMemoIds"
                  show-done-for-today
                  :done-for-today-memo-slugs="doneTodayMemoSlugs"
                  :pending-done-for-today-memo-slugs="pendingDoneForTodayMemoSlugs"
                  @done-for-today="markDoneForToday"
                  @undo-done-for-today="clearDoneForToday"
                />
              </section>
            </template>

            <MemoCards
              v-else
              :memos="limitedRecentMemos"
              :bookmarked-memo-ids="bookmarkedMemoIds"
            />

            <div
              v-if="hasMoreRecentMemos"
              class="mt-4 text-center"
            >
              <AppButton
                variant="link"
                color="info"
                class="text-sm"
                @click="loadMore"
              >
                Load more
              </AppButton>
            </div>
          </template>
        </AppPageFrame>
      </div>
    </template>

    <template #actions>
      <div v-if="memos">
        <SearchPalette
          :workspace-slug="workspaceSlug"
          :memos="memos"
          type="search"
          shortcut-symbol="k"
        />
      </div>
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import MemoCards from './MemoCards.vue';
import { useMemoBrowsing } from './useMemoBrowsing';

import AppPageFrame from '~/app/elements/layout/AppPageFrame.vue';
import AppPageHeader from '~/app/elements/layout/AppPageHeader.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
import { SearchPalette } from '~/app/features/search';
import { command } from '~/resources/command';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const route = useRoute();
const workspaceSlug = getEncodedWorkspaceSlugFromPath(route)!;
const pendingDoneForTodayMemoSlugs = ref<string[]>([]);

const {
  memos,
  isLoading,
  bookmarkedMemoIds,
  doneTodayMemoSlugs,
  isFocusFilter,
  recentMemos,
  limitedRecentMemos,
  limitedActiveFocusMemos,
  limitedDoneTodayFocusMemos,
  hasMoreRecentMemos,
  headingLabel,
  headingIcon,
  emptyLabel,
  loadMore,
} = useMemoBrowsing();

const markDoneForToday = async (memoSlug: string) => {
  if (pendingDoneForTodayMemoSlugs.value.includes(memoSlug)) return;
  pendingDoneForTodayMemoSlugs.value = [...pendingDoneForTodayMemoSlugs.value, memoSlug];
  try {
    await command.focusDailyState.markDoneForToday(workspaceSlug, memoSlug);
  }
  finally {
    pendingDoneForTodayMemoSlugs.value = pendingDoneForTodayMemoSlugs.value.filter(slug => slug !== memoSlug);
  }
};

const clearDoneForToday = async (memoSlug: string) => {
  if (pendingDoneForTodayMemoSlugs.value.includes(memoSlug)) return;
  pendingDoneForTodayMemoSlugs.value = [...pendingDoneForTodayMemoSlugs.value, memoSlug];
  try {
    await command.focusDailyState.clearDoneForToday(workspaceSlug, memoSlug);
  }
  finally {
    pendingDoneForTodayMemoSlugs.value = pendingDoneForTodayMemoSlugs.value.filter(slug => slug !== memoSlug);
  }
};
</script>

<style scoped>
.memo-browsing-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-background);
}

.memo-browsing-done-section {
  margin-top: 1.5rem;
}

.memo-browsing-done-heading {
  margin: 0 0 0.75rem;
  padding-inline-start: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
