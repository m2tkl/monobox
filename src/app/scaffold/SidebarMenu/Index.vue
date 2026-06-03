<template>
  <div
    v-if="isOpen"
    class="size-full"
  >
    <div class="flex h-full flex-col px-3 py-2">
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="py-1.5">
          <NewMemoActions />
        </div>
        <div
          v-if="workspaceSlug"
          class="pb-1"
        >
          <button
            type="button"
            class="sidebar-action sidebar-link"
            @click="openSearchPalette"
          >
            <UIcon
              :name="iconKey.search"
              class="shrink-0"
            />
            <span class="sidebar-action-label">Quick open</span>
          </button>
          <SearchPalette
            ref="searchPaletteRef"
            :workspace-slug="workspaceSlug"
            :memos="workspaceMemos"
            type="search"
            shortcut-symbol="k"
          />
        </div>
        <div
          v-if="workspaceSlug"
          class="pb-1"
        >
          <NuxtLink
            :to="`/${workspaceSlug}/_search`"
            class="sidebar-action sidebar-link"
          >
            <UIcon
              :name="iconKey.fullSearch"
              class="shrink-0"
            />
            <span class="sidebar-action-label">Full search</span>
          </NuxtLink>
        </div>
        <div
          v-if="workspaceSlug"
          class="pb-1"
        >
          <button
            type="button"
            class="sidebar-action sidebar-link"
            @click="showRandomMemo"
          >
            <UIcon
              :name="iconKey.shuffle"
              class="shrink-0"
            />
            <span class="sidebar-action-label">Random memo</span>
          </button>
        </div>
        <div
          v-if="workspaceSlug"
          class="pb-1"
        >
          <NuxtLink
            :to="`/${workspaceSlug}/_files`"
            class="sidebar-action sidebar-link"
          >
            <UIcon
              :name="iconKey.documentAttachment"
              class="shrink-0"
            />
            <span class="sidebar-action-label">Files</span>
          </NuxtLink>
        </div>
        <div
          v-if="workspaceSlug"
          class="pb-1"
        >
          <NuxtLink
            :to="`/${workspaceSlug}/_calendar`"
            class="sidebar-action sidebar-link"
          >
            <UIcon
              :name="iconKey.calendar"
              class="shrink-0"
            />
            <span class="sidebar-action-label">Calendar</span>
          </NuxtLink>
        </div>

        <section
          v-if="workspaceSlug && globalStatuses.length > 0"
          class="sidebar-section"
        >
          <div class="sticky top-0 z-10">
            <div class="flex h-8 items-center px-2">
              <h2 class="text-xs font-semibold uppercase tracking-wide sidebar-heading">
                Status
              </h2>
            </div>
          </div>
          <ul class="sidebar-link-list sidebar-link-list--status">
            <li>
              <MemoLinkRow
                :to="`/${workspaceSlug}/_kanban`"
                memo-title="All"
                :active="isKanbanAllActive"
              />
            </li>
            <li
              v-for="status in globalStatuses"
              :key="status.id"
            >
              <MemoLinkRow
                :to="`/${workspaceSlug}?status=${encodeURIComponent(status.name)}`"
                :memo-title="status.name"
                :count="status.count"
                :active="activeStatusName === status.name"
              />
            </li>
          </ul>
        </section>

        <!-- Bookmark section -->
        <section
          v-if="bookmarks.length > 0"
          class="sidebar-section"
        >
          <div class="sticky top-0 z-10">
            <div class="flex h-8 items-center px-2">
              <h2 class="text-xs font-semibold uppercase tracking-wide sidebar-heading">
                Bookmarks
              </h2>
            </div>
          </div>

          <ul class="sidebar-link-list sidebar-link-list--bookmarks">
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
                :active="activeMemoSlug === memo.slug_title"
              />
            </li>
          </ul>
        </section>
      </div>

      <div
        v-if="workspaceSlug"
        class="border-top pt-2"
      >
        <NuxtLink
          :to="`/_setting?workspace=${workspaceSlug}`"
          class="sidebar-action sidebar-link"
        >
          <UIcon
            :name="iconKey.setting"
            class="shrink-0"
          />
          <span class="sidebar-action-label">Settings</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import MemoLinkRow from './MemoLinkRow.vue';
import NewMemoActions from './NewMemoActions.vue';

import { useBookmarkListReadModel, useGlobalStatusBoardReadModel, useWorkspaceMemosReadModel } from '~/app/features/memo-browsing';
import { SearchPalette } from '~/app/features/search';
import { command } from '~/resources/command';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

defineProps<{ isOpen: boolean }>();

const route = useRoute();
const router = useRouter();

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route));

const bookmarkVM = useBookmarkListReadModel();
const workspaceMemosVM = useWorkspaceMemosReadModel();
const globalStatusVM = useGlobalStatusBoardReadModel();
const bookmarks = computed(() => bookmarkVM.value.data.items);
const workspaceMemos = computed(() => workspaceMemosVM.value.data.items);
const globalStatuses = computed(() => globalStatusVM.value.data.statuses);
const activeMemoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');
const activeStatusName = computed(() => {
  if (route.path !== `/${workspaceSlug.value}`) return '';
  const raw = route.query.status;
  if (Array.isArray(raw)) return raw[0] ?? '';
  return typeof raw === 'string' ? raw : '';
});
const isKanbanAllActive = computed(() => route.path === `/${workspaceSlug.value}/_kanban`);
const searchPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null);
const draggedMemoId = ref<number | null>(null);
const draggedMemoSlug = ref<string | null>(null);
const dropMemoId = ref<number | null>(null);
const dropPosition = ref<'before' | 'after' | null>(null);
const isReordering = ref(false);

const clearDragState = () => {
  draggedMemoId.value = null;
  draggedMemoSlug.value = null;
  dropMemoId.value = null;
  dropPosition.value = null;
};

const openSearchPalette = () => {
  searchPaletteRef.value?.openCommandPalette();
};

const showRandomMemo = async () => {
  if (!workspaceSlug.value || workspaceMemos.value.length === 0) {
    return;
  }

  const randomMemo = workspaceMemos.value[Math.floor(Math.random() * workspaceMemos.value.length)];
  if (!randomMemo) {
    return;
  }

  await router.push(`/${workspaceSlug.value}/${randomMemo.slug_title}`);
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
  }
  finally {
    isReordering.value = false;
    clearDragState();
  }
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

.sidebar-section {
  margin-top: 0.75rem;
  border-top: 1px solid var(--color-border-light);
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
}

.sidebar-section:first-of-type {
  margin-top: 0.5rem;
}

.sidebar-link-list {
  display: flex;
  flex-direction: column;
}

.sidebar-link-list--status {
  gap: 0.125rem;
}

.sidebar-link-list--bookmarks {
  gap: 0;
}

.sidebar-action {
  display: flex;
  width: 100%;
  min-height: 1.75rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.375rem;
  padding: 0.1875rem 0.5rem;
  font-size: 0.875rem;
}

.sidebar-action-label {
  line-height: 1;
}
</style>
