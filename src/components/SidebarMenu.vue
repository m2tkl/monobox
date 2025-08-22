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
            <NuxtLink
              :to="`/${workspaceSlug}/${memo.slug_title}`"
              class="block rounded-md px-2 py-1 text-sm sidebar-link"
              active-class="is-active"
            >
              {{ extractsTitleParts(memo.title).memoTitle }}
              <span
                v-if="extractsTitleParts(memo.title).context"
                class="memo-link-description text-xs"
              >
                @{{ extractsTitleParts(memo.title).context }}
              </span>
            </NuxtLink>
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
            <NuxtLink
              :to="`/${memo.workspace}/${memo.slug}${memo.hash || ''}`"
              :class="{
                'sidebar-link': true,
                'is-active': isActive(memo),
                'sidebar-external': memo.workspace !== workspaceSlug,
                'block rounded-md px-2 py-1 text-sm': true,
              }"
            >
              {{ extractsTitleParts(memo.title).memoTitle }}
              <span v-if="memo.workspace !== workspaceSlug"> [external]</span>
              <span
                v-if="extractsTitleParts(memo.title).context"
                class="memo-link-description text-xs"
              >
                @{{ extractsTitleParts(memo.title).context }}
              </span>
            </NuxtLink>
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
import { computed, ref } from 'vue';

defineProps<{ isOpen: boolean }>();

const route = useRoute();
const store = useWorkspaceStore();

const workspaceSlug = computed(() => route.params.workspace as string);

const recentStore = useRecentMemoStore();
const recentMemos = computed(() => recentStore.history);
const bookmarks = computed(() => store.bookmarkedMemos);

const recentMenuItems = [
  'Modified',
];
const sortTypeSelected = ref(recentMenuItems[0]);

const memoSlug = computed(() => {
  const memoSlugParam = (route.params.memo) as string | undefined;
  return memoSlugParam ? encodeForSlug(memoSlugParam) : '';
});

const isActive = (memo: { workspace: string; slug: string; hash?: string }) => {
  const hashMatches = memo.hash ? memo.hash === route.hash : !route.hash;
  return (
    route.params.workspace === memo.workspace
    && memoSlug.value === memo.slug
    && hashMatches
  );
};

function extractsTitleParts(title: string): { memoTitle: string; context: string } {
  const parts = title.split('/');
  const memoTitle = parts.pop() ?? title;
  return { memoTitle, context: parts.join('/') };
}
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
