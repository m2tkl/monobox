<template>
  <div
    v-if="isOpen"
    class="size-full"
  >
    <!-- Workspace section -->
    <div class="border-bottom flex h-10 items-center gap-1 px-2">
      <UIcon
        :name="iconKey.memoLink"
        class="mx-1"
      />
      <WorkspaceMenu :workspace-slug="workspaceSlug" />
      <div class="flex-1" />
      <IconButton
        :icon="iconKey.sidebarClose"
        @click="toggleSidebar"
      />
    </div>

    <div class="h-[calc(100%-40px)] overflow-y-auto px-3">
      <!-- Bookmark section -->
      <section
        v-if="favoriteMemos.length > 0"
        class="pb-2"
      >
        <div class="sticky top-0 z-10 bg-surface">
          <div class="flex h-12 items-center">
            <UIcon
              :name="iconKey.bookmark"
              class="mr-2"
            />
            <h2 class="font-bold text-gray-600">
              Favorites
            </h2>
          </div>
        </div>

        <ul class="flex flex-col">
          <li
            v-for="memo in favoriteMemos"
            :key="memo.id"
          >
            <NuxtLink
              :to="`/${workspaceSlug}/${memo.slug_title}`"
              class="block rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-slate-100 hover:text-blue-700"
              active-class="bg-slate-100 font-bold"
            >
              {{ memo.title }}
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Recently viewed memos section -->
      <section>
        <div class="sticky top-0 z-10 bg-surface">
          <div class="flex h-12 items-center">
            <UIcon
              :name="iconKey.recent"
              class="mr-2"
            />
            <h2 class="font-bold text-gray-600">
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
            :key="memo.id"
          >
            <NuxtLink
              :to="`/${workspaceSlug}/${memo.slug_title}`"
              class="block rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-slate-100 hover:text-blue-700"
              active-class="bg-slate-100 font-bold"
            >
              {{ memo.title }}
            </NuxtLink>
          </li>
        </ul>

        <p
          v-else
          class="pl-2 text-sm text-gray-600"
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

const { toggleSidebar } = useUIState();

const favoriteMemos = computed(() => store.favoriteMemos);
const recentMemos = computed(() => {
  return store.workspaceMemos.filter(memo => !store.favoriteMemos?.map(item => item.title).includes(memo.title)).slice(0, 5);
});

const recentMenuItems = [
  'Modified',
];
const sortTypeSelected = ref(recentMenuItems[0]);
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
