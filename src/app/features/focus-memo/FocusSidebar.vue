<template>
  <aside
    v-if="workspaceSlug"
    class="focus-sidebar border-left"
    :class="{
      'focus-sidebar--open': props.isOpen,
      'focus-sidebar--floating': props.floating,
    }"
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
          v-for="memo in visibleActiveItems"
          :key="memo.id"
          class="focus-sidebar-row"
          :class="{
            'focus-sidebar-row--active': memo.slug_title === currentMemoSlug,
          }"
        >
          <IconButton
            :icon="iconKey.success"
            aria-label="Done for today"
            class="focus-sidebar-row-action"
            @click="toggleDoneForToday(memo.slug_title)"
          />
          <NuxtLink
            :to="`/${workspaceSlug}/${memo.slug_title}`"
            class="focus-sidebar-row-link"
            @click="closeAfterNavigation"
          >
            <span class="focus-sidebar-row-title">
              {{ getMemoTitleParts(memo.title).memoTitle }}
            </span>
            <span
              v-if="getMemoTitleParts(memo.title).context"
              class="focus-sidebar-row-context"
            >
              @{{ getMemoTitleParts(memo.title).context }}
            </span>
          </NuxtLink>
          <span
            v-if="getTaskSummary(memo.slug_title).total > 0"
            class="focus-sidebar-task-summary"
          >
            <UIcon
              v-if="getTaskSummary(memo.slug_title).checked === getTaskSummary(memo.slug_title).total"
              :name="iconKey.success"
            />
            <template v-else>
              {{ getTaskSummary(memo.slug_title).checked }}/{{ getTaskSummary(memo.slug_title).total }}
            </template>
          </span>
        </li>
        <li
          v-if="visibleDoneItems.length > 0"
          class="focus-sidebar-done-separator"
          aria-hidden="true"
        />
        <li
          v-for="memo in visibleDoneItems"
          :key="memo.id"
          class="focus-sidebar-row focus-sidebar-row--done"
          :class="{ 'focus-sidebar-row--active': memo.slug_title === currentMemoSlug }"
        >
          <IconButton
            :icon="iconKey.renew"
            aria-label="Undo done for today"
            class="focus-sidebar-row-action"
            @click="toggleDoneForToday(memo.slug_title)"
          />
          <NuxtLink
            :to="`/${workspaceSlug}/${memo.slug_title}`"
            class="focus-sidebar-row-link"
            @click="closeAfterNavigation"
          >
            <span class="focus-sidebar-row-title">
              {{ getMemoTitleParts(memo.title).memoTitle }}
            </span>
            <span
              v-if="getMemoTitleParts(memo.title).context"
              class="focus-sidebar-row-context"
            >
              @{{ getMemoTitleParts(memo.title).context }}
            </span>
          </NuxtLink>
          <span
            v-if="getTaskSummary(memo.slug_title).total > 0"
            class="focus-sidebar-task-summary"
          >
            <UIcon
              v-if="getTaskSummary(memo.slug_title).checked === getTaskSummary(memo.slug_title).total"
              :name="iconKey.success"
            />
            <template v-else>
              {{ getTaskSummary(memo.slug_title).checked }}/{{ getTaskSummary(memo.slug_title).total }}
            </template>
          </span>
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
import type { JSONContent } from '@tiptap/core';

import { EditorQuery } from '~/app/features/editor';
import { useFocusListReadModel } from '~/app/features/memo-browsing';
import { command } from '~/resources/command';
import { iconKey } from '~/utils/icon';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const props = defineProps<{
  floating?: boolean;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const route = useRoute();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const currentMemoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');
const focusListVM = useFocusListReadModel();
const focusItems = computed(() => focusListVM.value.data.items);
const activeItems = computed(() => focusListVM.value.data.activeItems);
const doneTodayMemoSlugs = computed(() => focusListVM.value.data.doneTodayMemoSlugs);
const isExpanded = ref(false);
const visibleItemLimit = 8;
const doneItems = computed(() => focusItems.value.filter(memo => isDoneToday(memo.slug_title)));
const orderedItems = computed(() => [...activeItems.value, ...doneItems.value]);
const visibleItems = computed(() => isExpanded.value ? orderedItems.value : orderedItems.value.slice(0, visibleItemLimit));
const visibleActiveItems = computed(() => visibleItems.value.filter(memo => !isDoneToday(memo.slug_title)));
const visibleDoneItems = computed(() => visibleItems.value.filter(memo => isDoneToday(memo.slug_title)));
const emptyTaskSummary: EditorQuery.TaskSummary = { checked: 0, total: 0 };
const taskSummaryCache = new Map<string, EditorQuery.TaskSummary>();
const taskSummariesByMemoSlug = ref<Record<string, EditorQuery.TaskSummary>>({});

const isDoneToday = (memoSlug: string) => doneTodayMemoSlugs.value.has(memoSlug);
const getTaskSummary = (memoSlug: string) => taskSummariesByMemoSlug.value[memoSlug] ?? emptyTaskSummary;
const getMemoTitleParts = (title: string): { memoTitle: string; context: string } => {
  const parts = title.split('/');
  const memoTitle = parts.pop() ?? title;
  return { memoTitle, context: parts.join('/') };
};

const toggleDoneForToday = async (memoSlug: string) => {
  if (!workspaceSlug.value) return;
  if (isDoneToday(memoSlug)) {
    await command.focusDailyState.clearDoneForToday(workspaceSlug.value, memoSlug);
    return;
  }
  await command.focusDailyState.markDoneForToday(workspaceSlug.value, memoSlug);
};

const closeAfterNavigation = () => {
  if (props.floating) {
    emit('close');
  }
};

let taskSummaryRequestId = 0;

watch([workspaceSlug, visibleItems], async ([nextWorkspaceSlug, nextVisibleItems]) => {
  const requestId = ++taskSummaryRequestId;
  if (!nextWorkspaceSlug || nextVisibleItems.length === 0) {
    taskSummariesByMemoSlug.value = {};
    return;
  }

  const summaries = await Promise.all(
    nextVisibleItems.map(async (memo) => {
      const cacheKey = `${nextWorkspaceSlug}/${memo.slug_title}/${memo.modified_at}`;
      const cached = taskSummaryCache.get(cacheKey);
      if (cached) {
        return [memo.slug_title, cached] as const;
      }

      try {
        const detail = await command.memo.get({
          workspaceSlugName: nextWorkspaceSlug,
          memoSlugTitle: memo.slug_title,
        });
        const summary = EditorQuery.summarizeTaskItems(JSON.parse(detail.content) as JSONContent);
        taskSummaryCache.set(cacheKey, summary);
        return [memo.slug_title, summary] as const;
      }
      catch {
        return [memo.slug_title, emptyTaskSummary] as const;
      }
    }),
  );

  if (requestId !== taskSummaryRequestId) {
    return;
  }

  taskSummariesByMemoSlug.value = Object.fromEntries(summaries);
}, { immediate: true });
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
  display: block;
  height: 100%;
}

.focus-sidebar--floating.focus-sidebar--open {
  box-shadow: none;
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
  grid-template-columns: 1.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.125rem;
  border-radius: 0.375rem;
  padding: 0.0625rem;
  transition: background-color 0.18s ease;
}

.focus-sidebar-row:hover,
.focus-sidebar-row--active {
  background: var(--color-surface-hover);
}

.focus-sidebar-done-separator {
  height: 1px;
  margin: 0.375rem 0.25rem;
  background: var(--color-border-light);
}

.focus-sidebar-row-action {
  align-self: center;
}

.focus-sidebar-row-link {
  display: flex;
  min-width: 0;
  min-height: 1.75rem;
  flex-direction: column;
  justify-content: center;
  border-radius: 0.25rem;
  padding: 0.1875rem 0.125rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.2;
}

.focus-sidebar-row-link:hover,
.focus-sidebar-row--active .focus-sidebar-row-link {
  color: var(--color-text-primary);
}

.focus-sidebar-row-title,
.focus-sidebar-row-context {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-sidebar-row-context {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.focus-sidebar-task-summary {
  display: inline-flex;
  min-width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  padding-right: 0.25rem;
}

.focus-sidebar-row--done .focus-sidebar-row-link {
  color: var(--color-text-muted);
}

.focus-sidebar-row--done .focus-sidebar-row-title {
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
</style>
