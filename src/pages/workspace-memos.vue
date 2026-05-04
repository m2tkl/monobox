<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="size-full">
        <div class="size-full px-4 pb-4 overflow-y-auto">
          <!-- Memo List -->
          <LoadingSpinner v-if="memosVM.flags.isLoading" />
          <div
            v-else-if="recentMemos.length === 0"
            class="flex items-center justify-center h-full text-center"
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
import MemoCards from '~/app/features/memo/ui/list/MemoCards.vue';
import SearchPalette from '~/app/features/search/SearchPalette.vue';
import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import { useBookmarkListViewModel } from '~/resource-state/viewmodels/bookmarkList';
import { useWorkspaceMemosViewModel } from '~/resource-state/viewmodels/workspaceMemos';

const PAGE_LOAD_BASE_NUM = 64;

definePageMeta({
  path: '/:workspace',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});

const route = useRoute();
const workspaceSlug = getEncodedWorkspaceSlugFromPath(route)!;

const memosVM = useWorkspaceMemosViewModel();
const bookmarkVM = useBookmarkListViewModel();

const memos = computed(() => memosVM.value.data.items);
const bookmarkedMemoIds = computed(() => bookmarkVM.value.data.items.map(memo => memo.id));

const recentMemosDisplayCount = ref(PAGE_LOAD_BASE_NUM);

const recentMemos = computed(() => {
  return memos.value;
});
const limitedRecentMemos = computed(() => {
  return recentMemos.value.slice(0, recentMemosDisplayCount.value);
});
const hasMoreRecentMemos = computed(() => {
  return recentMemos.value.length > recentMemosDisplayCount.value;
});

const loadMore = () => {
  recentMemosDisplayCount.value += PAGE_LOAD_BASE_NUM;
};
</script>

<style scoped>
.truncate-multiline {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  /* 10 lines is just an arbitrary number that seemed reasonable. */
  -webkit-line-clamp: 10;
  text-overflow: ellipsis;
  /* Control the layout using height instead of setting a fixed number of lines */
  line-clamp: unset;
  overflow: hidden;
}
</style>
