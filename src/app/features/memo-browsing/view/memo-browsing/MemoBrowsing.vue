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

            <MemoCards
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
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const route = useRoute();
const workspaceSlug = getEncodedWorkspaceSlugFromPath(route)!;

const {
  memos,
  isLoading,
  bookmarkedMemoIds,
  recentMemos,
  limitedRecentMemos,
  hasMoreRecentMemos,
  headingLabel,
  headingIcon,
  emptyLabel,
  loadMore,
} = useMemoBrowsing();
</script>

<style scoped>
.memo-browsing-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-background);
}
</style>
