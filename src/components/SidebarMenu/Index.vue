<template>
  <div
    v-if="isOpen"
    class="size-full"
  >
    <div class="h-full overflow-y-auto px-3">
      <!-- Bookmark section -->
      <section
        v-if="bookmarks.length > 0"
        class="pb-2"
      >
        <div
          class="sticky top-0 z-10"
          style="background-color: var(--color-background)"
        >
          <div class="flex h-12 items-center ml-1">
            <UIcon
              :name="iconKey.bookmark"
              class="mr-2"
            />
            <h2 class="font-bold sidebar-heading">
              Bookmarks
            </h2>
          </div>
        </div>

        <ul class="flex flex-col">
          <li
            v-for="memo in bookmarks"
            :key="memo.id"
          >
            <MemoLinkRow
              :to="`/${workspaceSlug}/${memo.slug_title}`"
              :memo-title="memo.title"
            />
          </li>
        </ul>
      </section>

      <!-- Recently viewed memos section -->
      <section>
        <div
          class="sticky top-0 z-10"
          style="background-color: var(--color-background)"
        >
          <div class="flex h-12 items-center ml-1">
            <UIcon
              :name="iconKey.recent"
              class="mr-2"
            />
            <h2 class="font-bold sidebar-heading">
              Recent
            </h2>
            <USelect
              v-model="sortTypeSelected"
              :options="recentMenuItems"
              variant="none"
              class="text-gray-500"
            />
          </div>
        </div>

        <ul
          v-if="recentMemos.length > 0"
          class="flex flex-col"
        >
          <li
            v-for="memo in recentMemos"
            :key="`${memo.workspace}/${memo.slug}${memo.hash || ''}`"
          >
            <MemoLinkRow
              :to="`/${memo.workspace}/${memo.slug}${memo.hash || ''}`"
              :memo-title="memo.title"
              :external="memo.workspace !== workspaceSlug"
              :active="isActive(memo)"
            />
          </li>
        </ul>

        <p
          v-else
          class="pl-2 text-sm sidebar-no-memos"
        >
          No memos
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import MemoLinkRow from './MemoLinkRow.vue';

import { getEncodedMemoSlugFromPath } from '~/utils/route';

defineProps<{ isOpen: boolean }>();

const route = useRoute();
const store = useWorkspaceStore();

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route));
const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

const recentStore = useRecentMemoStore();
const recentMemos = computed(() => recentStore.history);
const bookmarks = computed(() => store.bookmarkedMemos);

const recentMenuItems = [
  'Modified',
];
const sortTypeSelected = ref(recentMenuItems[0]);

const isActive = (memo: { workspace: string; slug: string; hash?: string }) => {
  const hashMatches = memo.hash ? memo.hash === route.hash : !route.hash;
  return (
    route.params.workspace === memo.workspace
    && memoSlug.value === memo.slug
    && hashMatches
  );
};
</script>

<style scoped>
.sidebar {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
  transform: translateX(-100%);
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar {
  display: none;
}

.sidebar.is-open {
  transform: translateX(0);
}
</style>
