<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="size-full">
        <div class="size-full overflow-y-auto px-4 pb-4">
          <LoadingSpinner v-if="memosReadModel.flags.isLoading" />
          <div
            v-else-if="recentMemos.length === 0"
            class="flex h-full items-center justify-center text-center"
            style="color: var(--color-text-secondary)"
          >
            No recent memos
          </div>

          <template v-else>
            <div
              class="sticky top-0 z-10"
              style="background-color: var(--color-background)"
            >
              <div class="flex h-12 items-center">
                <UIcon
                  :name="iconKey.recent"
                  class="mr-2"
                />
                <h2 class="font-bold sidebar-heading">
                  Recent
                </h2>
              </div>
            </div>

            <MemoCards
              :memos="limitedRecentMemos"
              :bookmarked-memo-ids="bookmarkedMemoIds"
            />

            <div
              v-if="hasMoreRecentMemos"
              class="mt-4 text-center"
            >
              <UButton
                variant="link"
                color="info"
                class="text-sm"
                @click="loadMore"
              >
                Load more
              </UButton>
            </div>
          </template>
        </div>
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
import { useMemoBrowsing } from './view-model/memoBrowsing';
import MemoCards from './views/MemoCards.vue';

import { SearchPalette } from '~/features/search';
import LoadingSpinner from '~/shared/components/status/LoadingSpinner.vue';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const route = useRoute();
const workspaceSlug = getEncodedWorkspaceSlugFromPath(route)!;

const {
  memosReadModel,
  memos,
  bookmarkedMemoIds,
  recentMemos,
  limitedRecentMemos,
  hasMoreRecentMemos,
  loadMore,
} = useMemoBrowsing();
</script>
