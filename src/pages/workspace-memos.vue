<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="size-full">
        <div class="size-full px-4 pb-4 overflow-y-auto">
          <!-- Memo List -->
          <LoadingSpinner v-if="memosVM.flags.isLoading" />
          <div
            v-else-if="memos.length === 0"
            class="flex items-center justify-center h-full text-center"
            style="color: var(--color-text-secondary)"
          >
            No memos
          </div>

          <template v-else>
            <section v-if="bookmarks.length > 0">
              <div
                class="sticky top-0 z-10"
                style="background-color: var(--color-background)"
              >
                <div class="flex h-12 items-center">
                  <UIcon
                    :name="iconKey.bookmark"
                    class="mr-2"
                  />
                  <h2 class="font-bold sidebar-heading">
                    Bookmarks
                  </h2>
                </div>
              </div>

              <MemoCards
                :memos="bookmarks"
              />
            </section>

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

            <MemoCards :memos="limitedRecentMemos" />

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
      <!-- New memo action button -->
      <div class="fixed bottom-10 right-10 z-50">
        <NuxtLink :to="`/${workspaceSlug}/new`">
          <UButton
            :icon="iconKey.add"
            square
            variant="solid"
            size="xl"
            style="background-color: var(--color-primary)"
          />
        </NuxtLink>
      </div>

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
import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import MemoCards from '~/app/features/memo/list/MemoCards.vue';
import SearchPalette from '~/app/features/search/SearchPalette.vue';
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

const recentMemosDisplayCount = ref(PAGE_LOAD_BASE_NUM);

const recentMemos = computed(() => {
  const bookmarkedIds = new Set(bookmarkVM.value.data.items.map(m => m.id));
  return memos.value.filter(memo => !bookmarkedIds.has(memo.id));
});
const limitedRecentMemos = computed(() => {
  return recentMemos.value.slice(0, recentMemosDisplayCount.value);
});
const hasMoreRecentMemos = computed(() => {
  return recentMemos.value.length > recentMemosDisplayCount.value;
});

const bookmarks = computed(() => bookmarkVM.value.data.items);

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
