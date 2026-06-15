<template>
  <div
    v-if="isOpen"
    class="size-full"
  >
    <div class="flex h-full flex-col px-3 py-2">
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="sidebar-primary-action">
          <NewMemoActions />
        </div>
        <div
          v-if="workspaceSlug"
          class="sidebar-action-grid"
        >
          <AppTooltip text="Quick open">
            <button
              type="button"
              class="sidebar-icon-action sidebar-link"
              aria-label="Quick open"
              @click="openSearchPalette"
            >
              <UIcon
                :name="iconKey.search"
                class="sidebar-icon-action__icon"
              />
            </button>
          </AppTooltip>
          <SearchPalette
            ref="searchPaletteRef"
            :workspace-slug="workspaceSlug"
            :memos="workspaceMemos"
            type="search"
            shortcut-symbol="k"
          />
          <AppTooltip text="Full search">
            <NuxtLink
              :to="`/${workspaceSlug}/_search`"
              class="sidebar-icon-action sidebar-link"
              aria-label="Full search"
            >
              <UIcon
                :name="iconKey.fullSearch"
                class="sidebar-icon-action__icon"
              />
            </NuxtLink>
          </AppTooltip>
          <AppTooltip text="Random memo">
            <button
              type="button"
              class="sidebar-icon-action sidebar-link"
              aria-label="Random memo"
              @click="showRandomMemo"
            >
              <UIcon
                :name="iconKey.shuffle"
                class="sidebar-icon-action__icon"
              />
            </button>
          </AppTooltip>
          <AppTooltip text="Files">
            <NuxtLink
              :to="`/${workspaceSlug}/_files`"
              class="sidebar-icon-action sidebar-link"
              aria-label="Files"
            >
              <UIcon
                :name="iconKey.documentAttachment"
                class="sidebar-icon-action__icon"
              />
            </NuxtLink>
          </AppTooltip>
          <AppTooltip text="Calendar">
            <NuxtLink
              :to="`/${workspaceSlug}/_calendar`"
              class="sidebar-icon-action sidebar-link"
              aria-label="Calendar"
            >
              <UIcon
                :name="iconKey.calendar"
                class="sidebar-icon-action__icon"
              />
            </NuxtLink>
          </AppTooltip>
        </div>

        <section
          v-if="workspaceSlug && globalStatuses.length > 0"
          class="sidebar-section"
        >
          <NuxtLink
            :to="`/${workspaceSlug}/_kanban`"
            class="sidebar-section-link"
            :class="{ 'sidebar-section-link--active': isKanbanViewActive }"
            active-class="sidebar-section-link--active"
            exact-active-class="sidebar-section-link--active"
            aria-label="Open Kanban view"
          >
            <span class="sidebar-section-link__label">
              <UIcon
                :name="iconKey.kanban"
                class="sidebar-section-link__icon"
              />
              <span>Kanban</span>
            </span>
            <UIcon
              :name="iconKey.arrowRight"
              class="sidebar-section-link__arrow"
            />
          </NuxtLink>
          <ul class="sidebar-link-list sidebar-link-list--status">
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
          <NuxtLink
            :to="{ path: `/${workspaceSlug}`, query: { bookmarked: 'true' } }"
            class="sidebar-section-link"
            :class="{ 'sidebar-section-link--active': isBookmarksViewActive }"
            active-class=""
            exact-active-class=""
            aria-label="Open bookmarked memos"
          >
            <span class="sidebar-section-link__label">
              <UIcon
                :name="iconKey.bookmarkFilled"
                class="sidebar-section-link__icon"
              />
              <span>Bookmarks</span>
            </span>
            <UIcon
              :name="iconKey.arrowRight"
              class="sidebar-section-link__arrow"
            />
          </NuxtLink>

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
const isKanbanViewActive = computed(() => route.path === `/${workspaceSlug.value}/_kanban`);
const isBookmarksViewActive = computed(() => {
  if (route.path !== `/${workspaceSlug.value}`) return false;
  const raw = route.query.bookmarked;
  return Array.isArray(raw) ? raw[0] === 'true' : raw === 'true';
});
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
  scrollbar-width: none;
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
  margin-top: 0;
}

.sidebar-section-link {
  display: flex;
  min-height: 2rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.sidebar-section-link:hover,
.sidebar-section-link--active {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.sidebar-section-link__label {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
}

.sidebar-section-link__icon,
.sidebar-section-link__arrow {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.sidebar-section-link__arrow {
  opacity: 0.7;
}

.sidebar-link-list {
  display: flex;
  flex-direction: column;
}

.sidebar-link-list--status {
  gap: 0.125rem;
  margin-top: 0.125rem;
}

.sidebar-link-list--bookmarks {
  gap: 0;
  margin-top: 0.125rem;
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

.sidebar-primary-action {
  padding-top: 0.375rem;
  padding-bottom: 0.5rem;
}

.sidebar-action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding-bottom: 0.5rem;
}

.sidebar-icon-action {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
}

.sidebar-icon-action__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
</style>
