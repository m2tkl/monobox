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
            draggable="true"
            class="bookmark-row"
            :class="{
              'is-dragging': draggedMemoId === memo.id,
              'drop-before': dropMemoId === memo.id && dropPosition === 'before',
              'drop-after': dropMemoId === memo.id && dropPosition === 'after',
            }"
            @dragstart="onBookmarkDragStart(memo.id)"
            @dragover.prevent="onBookmarkDragOver($event, memo.id)"
            @drop.prevent="onBookmarkDrop(memo.slug_title)"
            @dragend="clearDragState"
          >
            <MemoLinkRow
              :to="`/${workspaceSlug}/${memo.slug_title}`"
              :memo-title="memo.title"
              :count="memo.linkCount"
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
              :items="recentMenuItems"
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
import { ref } from 'vue';

import MemoLinkRow from './MemoLinkRow.vue';

import { command } from '~/external/tauri/command';
import { emitEvent } from '~/resource-state/infra/eventBus';
import { useBookmarkListViewModel } from '~/resource-state/viewmodels/bookmarkList';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

defineProps<{ isOpen: boolean }>();

const route = useRoute();

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route));
const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

const recentStore = useRecentMemoStore();
const recentMemos = computed(() => recentStore.history);

const bookmarkVM = useBookmarkListViewModel();
const bookmarks = computed(() => bookmarkVM.value.data.items);
const draggedMemoId = ref<number | null>(null);
const draggedMemoSlug = ref<string | null>(null);
const dropMemoId = ref<number | null>(null);
const dropPosition = ref<'before' | 'after' | null>(null);
const isReordering = ref(false);

const recentMenuItems = [
  'Modified',
];
const sortTypeSelected = ref(recentMenuItems[0]);

const clearDragState = () => {
  draggedMemoId.value = null;
  draggedMemoSlug.value = null;
  dropMemoId.value = null;
  dropPosition.value = null;
};

const onBookmarkDragStart = (memoId: number) => {
  const memo = bookmarks.value.find(item => item.id === memoId);
  if (!memo || isReordering.value) {
    return;
  }

  draggedMemoId.value = memoId;
  draggedMemoSlug.value = memo.slug_title;
};

const onBookmarkDragOver = (event: DragEvent, memoId: number) => {
  if (draggedMemoId.value === null || draggedMemoId.value === memoId || isReordering.value) {
    return;
  }

  const element = event.currentTarget as HTMLElement | null;
  if (!element) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const nextPosition = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
  dropMemoId.value = memoId;
  dropPosition.value = nextPosition;
};

const onBookmarkDrop = async (targetMemoSlug: string) => {
  if (
    !workspaceSlug.value
    || !draggedMemoSlug.value
    || dropMemoId.value === null
    || dropPosition.value === null
    || isReordering.value
  ) {
    clearDragState();
    return;
  }

  if (draggedMemoSlug.value === targetMemoSlug) {
    clearDragState();
    return;
  }

  isReordering.value = true;
  try {
    await command.bookmark.reorder(
      workspaceSlug.value,
      draggedMemoSlug.value,
      targetMemoSlug,
      dropPosition.value,
    );
    emitEvent('bookmark/updated', { workspaceSlug: workspaceSlug.value });
  }
  finally {
    isReordering.value = false;
    clearDragState();
  }
};

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

.bookmark-row {
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
}

.bookmark-row.is-dragging {
  opacity: 0.5;
}

.bookmark-row.drop-before {
  border-top-color: var(--color-primary);
}

.bookmark-row.drop-after {
  border-bottom-color: var(--color-primary);
}
</style>
