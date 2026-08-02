<template>
  <aside
    v-if="workspaceSlug"
    class="focus-sidebar border-left"
    :class="{ 'focus-sidebar--open': isOpen }"
    aria-label="Focus"
  >
    <div class="focus-sidebar-header">
      <div class="focus-sidebar-title">
        <UIcon
          :name="iconKey.focusFilled"
          class="focus-sidebar-title__icon"
        />
        <h2>Focus</h2>
      </div>
      <div class="focus-sidebar-actions">
        <span class="focus-sidebar-count">{{ activeItems.length }}</span>
        <IconButton
          :icon="iconKey.close"
          aria-label="Close Focus sidebar"
          @click="$emit('close')"
        />
      </div>
    </div>

    <div class="focus-sidebar-body">
      <p
        v-if="focusItems.length === 0"
        class="focus-sidebar-empty"
      >
        No focus memos.
      </p>
      <ul
        v-else
        class="focus-sidebar-list"
      >
        <li
          v-for="memo in visibleItems"
          :key="memo.id"
          class="focus-sidebar-row"
          :class="{ 'focus-sidebar-row--done': isDoneToday(memo.slug_title) }"
        >
          <MemoLinkRow
            :to="`/${workspaceSlug}/${memo.slug_title}`"
            :memo-title="memo.title"
            :active="memo.slug_title === currentMemoSlug"
            @click="closeAfterNavigation"
          />
          <IconButton
            :icon="isDoneToday(memo.slug_title) ? iconKey.renew : iconKey.success"
            :aria-label="isDoneToday(memo.slug_title) ? 'Undo done for today' : 'Done for today'"
            @click="toggleDoneForToday(memo.slug_title)"
          />
        </li>
      </ul>

      <button
        v-if="focusItems.length > visibleItemLimit"
        type="button"
        class="focus-sidebar-more"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? 'Show less' : `Show ${focusItems.length - visibleItemLimit} more` }}
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { mergeUniqueMemoItems } from './focusMemoUtils';

import type { MemoIndexItem } from '~/models/memo';

import MemoLinkRow from '~/app/scaffold/SidebarMenu/MemoLinkRow.vue';
import { useFocusDailyStateReadModel, useGlobalStatusBoardReadModel, useTodayCalendarMemoListReadModel } from '~/app/features/memo-browsing';
import { command } from '~/resources/command';
import { iconKey } from '~/utils/icon';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

type FocusDisplayItem = MemoIndexItem & {
  linkCount: number;
  orderIndex: number;
};

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const route = useRoute();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const currentMemoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');
const globalStatusVM = useGlobalStatusBoardReadModel();
const focusDailyStateVM = useFocusDailyStateReadModel();
const todayCalendarMemoVM = useTodayCalendarMemoListReadModel();
const doneTodayItems = computed(() => focusDailyStateVM.value.data.doneTodayItems);
const doneTodayMemoSlugs = computed(() => new Set(doneTodayItems.value.map(memo => memo.slug_title)));
const focusItems = computed<FocusDisplayItem[]>(() => {
  const nowMemoSlugs = new Set(globalStatusVM.value.data.nowItems.map(memo => memo.slug_title));
  const statusItems = globalStatusVM.value.data.nowItems;
  const calendarItems = todayCalendarMemoVM.value.data.items
    .filter(memo => !nowMemoSlugs.has(memo.slug_title))
    .map(memo => ({
      ...memo,
      orderIndex: statusItems.length + memo.orderIndex,
    }));

  return mergeUniqueMemoItems<FocusDisplayItem>(statusItems, calendarItems);
});
const activeItems = computed(() => focusItems.value.filter(memo => !doneTodayMemoSlugs.value.has(memo.slug_title)));
const isExpanded = ref(false);
const visibleItemLimit = 8;
const visibleItems = computed(() => isExpanded.value ? focusItems.value : focusItems.value.slice(0, visibleItemLimit));

const isDoneToday = (memoSlug: string) => doneTodayMemoSlugs.value.has(memoSlug);

const toggleDoneForToday = async (memoSlug: string) => {
  if (!workspaceSlug.value) return;
  if (isDoneToday(memoSlug)) {
    await command.focusDailyState.clearDoneForToday(workspaceSlug.value, memoSlug);
    return;
  }
  await command.focusDailyState.markDoneForToday(workspaceSlug.value, memoSlug);
};

const closeAfterNavigation = () => {
  if (window.innerWidth < 1280) {
    emit('close');
  }
};
</script>

<style scoped>
.focus-sidebar {
  display: none;
  width: 280px;
  height: 100%;
  flex-shrink: 0;
  background: var(--color-background);
}

.focus-sidebar--open {
  position: fixed;
  top: var(--app-titlebar-height);
  right: 0;
  bottom: 0;
  z-index: 1110;
  display: block;
  height: auto;
  box-shadow: -16px 0 48px rgb(15 23 42 / 0.16);
}

.focus-sidebar-header {
  display: flex;
  height: var(--memo-editor-toolbar-height, 2.5rem);
  min-height: var(--memo-editor-toolbar-height, 2.5rem);
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
  padding: 0 0.875rem;
}

.focus-sidebar-title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-primary);
}

.focus-sidebar-title h2 {
  margin: 0;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-sidebar-title__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.focus-sidebar-count {
  min-width: 1.375rem;
  border-radius: 999px;
  padding: 0.0625rem 0.375rem;
  color: white;
  background: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
}

.focus-sidebar-actions {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.25rem;
}

.focus-sidebar-body {
  min-height: 0;
  max-height: calc(100% - var(--memo-editor-toolbar-height, 2.5rem));
  overflow-y: auto;
  padding: 0.625rem;
}

.focus-sidebar-empty {
  margin: 0;
  padding: 0.375rem 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.focus-sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.focus-sidebar-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1.75rem;
  align-items: center;
  gap: 0.25rem;
  border-radius: 0.375rem;
}

.focus-sidebar-row--done :deep(.sidebar-link) {
  color: var(--color-text-muted);
}

.focus-sidebar-row--done :deep(.sidebar-link span) {
  text-decoration: line-through;
}

.focus-sidebar-more {
  display: block;
  width: 100%;
  margin-top: 0.375rem;
  border-radius: 0.375rem;
  padding: 0.375rem 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: left;
}

.focus-sidebar-more:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

@media (min-width: 1280px) {
  .focus-sidebar--open {
    position: static;
    display: block;
    height: 100%;
    box-shadow: none;
  }
}
</style>
