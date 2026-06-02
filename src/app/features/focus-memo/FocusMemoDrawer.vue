<template>
  <div
    v-if="workspaceSlug"
    class="focus-drawer"
    :class="{
      'focus-drawer--open': isOpen,
      'focus-drawer--expanded': isExpanded,
    }"
  >
    <button
      type="button"
      class="focus-drawer-tab"
      @click="isOpen = !isOpen"
    >
      <UIcon
        :name="iconKey.focusFilled"
        class="shrink-0"
      />
      <span>Focus</span>
      <span class="focus-drawer-count">{{ activeItems.length }}</span>
    </button>

    <div class="focus-drawer-panel">
      <div class="focus-drawer-header">
        <div class="flex min-w-0 items-center gap-2">
          <UIcon
            :name="iconKey.focusFilled"
            class="shrink-0"
          />
          <h2 class="truncate text-sm font-semibold">
            Focus
          </h2>
        </div>
        <div class="flex min-w-0 items-center gap-1.5">
          <div
            class="focus-sort-control"
            aria-label="Focus sort order"
          >
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              class="focus-sort-button"
              :class="{ 'focus-sort-button--active': sortMode === option.value }"
              :aria-pressed="sortMode === option.value"
              @click="sortMode = option.value"
            >
              <UIcon
                :name="option.icon"
                class="shrink-0"
              />
              <span>{{ option.label }}</span>
            </button>
          </div>
          <IconButton
            :icon="isExpanded ? iconKey.arrowDown : iconKey.arrowUp"
            :aria-label="isExpanded ? 'Collapse Focus' : 'Expand Focus'"
            @click="isExpanded = !isExpanded"
          />
          <AppButton
            size="xs"
            variant="ghost"
            color="neutral"
            :icon="iconKey.add"
            :disabled="!canAssignNow"
            @click="isPickerOpen = true"
          >
            Add
          </AppButton>
          <IconButton
            :icon="iconKey.close"
            aria-label="Close Focus"
            @click="isOpen = false"
          />
        </div>
      </div>

      <div class="focus-drawer-body">
        <div
          v-if="activeItems.length === 0"
          class="focus-empty"
        >
          No focus memos.
        </div>
        <ul
          v-else
          class="focus-card-grid"
        >
          <li
            v-for="memo in sortedActiveItems"
            :key="memo.id"
            class="focus-card"
          >
            <NuxtLink :to="`/${workspaceSlug}/${memo.slug_title}`">
              <MemoThumbnail
                :title="extractMemoTitle(memo.title)"
                :context="extractMemoContext(memo.title)"
                :description="memo.description"
                :thumbnail-image="memo.thumbnail_image"
              />
            </NuxtLink>
            <div class="focus-card-actions">
              <IconButton
                :icon="iconKey.success"
                aria-label="Done for today"
                @click="() => markDoneForToday(memo.slug_title)"
              />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <UModal
    v-if="workspaceSlug"
    v-model:open="isPickerOpen"
  >
    <template #content>
      <div class="focus-picker">
        <div class="focus-picker-header">
          <div>
            <h2 class="text-sm font-semibold">
              Add focus
            </h2>
            <p
              class="text-xs"
              style="color: var(--color-text-secondary)"
            >
              Move one or more memos to Now.
            </p>
          </div>
          <IconButton
            :icon="iconKey.close"
            aria-label="Close picker"
            @click="isPickerOpen = false"
          />
        </div>
        <UInput
          v-model="pickerQuery"
          :icon="iconKey.search"
          placeholder="Search memos"
        />
        <div class="focus-picker-list">
          <label
            v-for="memo in pickerMemos"
            :key="memo.id"
            class="focus-picker-row"
          >
            <UCheckbox
              :model-value="selectedMemoSlugs.has(memo.slug_title)"
              @update:model-value="() => togglePickerSelection(memo.slug_title)"
            />
            <span class="min-w-0 flex-1 truncate">{{ memo.title }}</span>
          </label>
        </div>
        <div class="focus-picker-footer">
          <AppButton
            variant="ghost"
            color="neutral"
            @click="isPickerOpen = false"
          >
            Cancel
          </AppButton>
          <AppButton
            :disabled="selectedMemoSlugs.size === 0 || isAdding"
            :loading="isAdding"
            @click="addSelectedFocusMemos"
          >
            Add selected
          </AppButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { GlobalStatusMemoListItem } from '~/app/features/memo-browsing/resource/read-model';

import { useFocusMemoListReadModel, useGlobalStatusBoardReadModel, useWorkspaceMemosReadModel } from '~/app/features/memo-browsing';
import MemoThumbnail from '~/app/features/memo-browsing/view/memo-browsing/MemoThumbnail.vue';
import { command } from '~/resources/command';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

type FocusSortMode = 'focused' | 'updated';

const route = useRoute();
const { ui } = useUIState();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const isPickerOpen = ref(false);
const pickerQuery = ref('');
const selectedMemoSlugs = ref(new Set<string>());
const isAdding = ref(false);
const sortOptions: { value: FocusSortMode; label: string; icon: string }[] = [
  { value: 'focused', label: 'Focused', icon: iconKey.focusFilled },
  { value: 'updated', label: 'Updated', icon: iconKey.recent },
];

const isOpen = computed({
  get: () => ui.value.isFocusPaneOpen,
  set: (value: boolean) => {
    ui.value.isFocusPaneOpen = value;
  },
});
const isExpanded = computed({
  get: () => ui.value.isFocusPaneExpanded,
  set: (value: boolean) => {
    ui.value.isFocusPaneExpanded = value;
  },
});
const sortMode = computed<FocusSortMode>({
  get: () => ui.value.focusPaneSortMode,
  set: (value: FocusSortMode) => {
    ui.value.focusPaneSortMode = value;
  },
});

const globalStatusVM = useGlobalStatusBoardReadModel();
const focusMemoVM = useFocusMemoListReadModel();
const workspaceMemosVM = useWorkspaceMemosReadModel();
const doneTodayMemoSlugs = computed(() => new Set(focusMemoVM.value.data.doneTodayItems.map(memo => memo.slug_title)));
const activeItems = computed(() => globalStatusVM.value.data.nowItems.filter(memo => !doneTodayMemoSlugs.value.has(memo.slug_title)));
const focusedMemoSlugs = computed(() => new Set(activeItems.value.map(memo => memo.slug_title)));
const globalKanbanId = computed(() => globalStatusVM.value.data.kanbanId);
const nowStatusId = computed(() => globalStatusVM.value.data.nowStatusId);
const canAssignNow = computed(() => globalKanbanId.value !== null && nowStatusId.value !== null);
const workspaceMemos = computed(() => workspaceMemosVM.value.data.items);

const sortFocusItems = (items: GlobalStatusMemoListItem[]) => {
  if (sortMode.value === 'focused') {
    return items;
  }

  return [...items].sort((a, b) => {
    const modifiedCompare = b.modified_at.localeCompare(a.modified_at);
    if (modifiedCompare !== 0) return modifiedCompare;
    return a.orderIndex - b.orderIndex;
  });
};

const sortedActiveItems = computed(() => sortFocusItems(activeItems.value));

const pickerMemos = computed(() => {
  const query = pickerQuery.value.trim().toLowerCase();
  return workspaceMemos.value
    .filter(memo => !focusedMemoSlugs.value.has(memo.slug_title))
    .filter((memo) => {
      if (!query) return true;
      return `${memo.title} ${memo.description ?? ''}`.toLowerCase().includes(query);
    })
    .slice(0, 80);
});

watch(isPickerOpen, (open) => {
  if (!open) {
    pickerQuery.value = '';
    selectedMemoSlugs.value = new Set();
  }
});

function extractTitleParts(title: string): { memoTitle: string; context: string } {
  const parts = title.split('/');
  const memoTitle = parts.pop() ?? title;
  return { memoTitle, context: parts.join('/') };
}

function extractMemoTitle(title: string) {
  return extractTitleParts(title).memoTitle;
}

function extractMemoContext(title: string) {
  return extractTitleParts(title).context;
}

function togglePickerSelection(memoSlug: string) {
  const next = new Set(selectedMemoSlugs.value);
  if (next.has(memoSlug)) {
    next.delete(memoSlug);
  }
  else {
    next.add(memoSlug);
  }
  selectedMemoSlugs.value = next;
}

async function addSelectedFocusMemos() {
  if (!workspaceSlug.value || selectedMemoSlugs.value.size === 0) return;
  if (globalKanbanId.value === null || nowStatusId.value === null) return;

  isAdding.value = true;
  try {
    for (const memoSlug of selectedMemoSlugs.value) {
      await command.kanbanAssignment.upsertStatus({
        workspaceSlugName: workspaceSlug.value,
        memoSlugTitle: memoSlug,
        kanbanId: globalKanbanId.value,
        kanbanStatusId: nowStatusId.value,
        position: null,
      });
      await command.focusMemo.add(workspaceSlug.value, memoSlug);
    }
    isPickerOpen.value = false;
  }
  finally {
    isAdding.value = false;
  }
}

async function markDoneForToday(memoSlug: string) {
  if (!workspaceSlug.value) return;
  await command.focusMemo.markDoneForToday(workspaceSlug.value, memoSlug);
}
</script>

<style scoped>
.focus-drawer {
  position: fixed;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 1200;
  pointer-events: none;
}

.focus-drawer-tab,
.focus-drawer-panel {
  pointer-events: auto;
}

.focus-drawer-tab {
  position: fixed;
  right: 1rem;
  bottom: 0;
  z-index: 1210;
  display: flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.375rem;
  border: 1px solid var(--color-border-light);
  border-bottom: 0;
  border-radius: 0.5rem 0.5rem 0 0;
  padding: 0.25rem 0.75rem;
  color: var(--color-text-primary);
  background: var(--color-background);
  box-shadow: 0 -8px 24px rgb(15 23 42 / 0.12);
}

.focus-drawer-count {
  min-width: 1.25rem;
  border-radius: 999px;
  padding: 0 0.375rem;
  font-size: 0.75rem;
  text-align: center;
  color: white;
  background: var(--color-primary);
}

.focus-drawer-panel {
  display: none;
  width: min(58rem, calc(100vw - 2rem));
  max-height: min(34vh, 18rem);
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-bottom: 0;
  border-radius: 0.5rem 0.5rem 0 0;
  background: var(--color-background);
  box-shadow: 0 -16px 48px rgb(15 23 42 / 0.16);
}

.focus-drawer--open .focus-drawer-panel {
  display: flex;
  flex-direction: column;
}

.focus-drawer--expanded .focus-drawer-panel {
  width: min(72rem, calc(100vw - 2rem));
  max-height: min(56vh, 28rem);
}

.focus-drawer-header {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--color-border-light);
  padding: 0.375rem 0.75rem;
}

.focus-sort-control {
  display: inline-flex;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  background: var(--color-surface);
}

.focus-sort-button {
  display: inline-flex;
  min-height: 1.75rem;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.focus-sort-button:hover,
.focus-sort-button--active {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.focus-sort-button--active {
  font-weight: 600;
}

.focus-drawer-body {
  height: 11.5rem;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.75rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);
}

.focus-drawer--expanded .focus-drawer-body {
  height: auto;
  overflow-x: auto;
  overflow-y: auto;
}

.focus-card-grid {
  display: flex;
  width: max-content;
  min-width: 100%;
  flex-wrap: nowrap;
  gap: 0.75rem;
}

.focus-card-grid::after {
  display: block;
  width: 0;
  min-width: 0;
  content: '';
}

.focus-drawer--expanded .focus-card-grid {
  display: grid;
  width: auto;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.focus-drawer--expanded .focus-card-grid::after {
  display: none;
}

.focus-card {
  position: relative;
  width: 10rem;
  height: 10rem;
  min-width: 10rem;
}

.focus-drawer--expanded .focus-card {
  width: auto;
  height: auto;
  min-width: 0;
}

.focus-card-actions {
  position: absolute;
  right: 0.375rem;
  bottom: 0.375rem;
  display: flex;
  gap: 0.25rem;
  border-radius: 0.5rem;
  padding: 0.125rem;
  background: var(--color-background);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.14);
}

.focus-empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.focus-done {
  margin-top: 0.75rem;
  color: var(--color-text-secondary);
}

.focus-done summary {
  cursor: pointer;
  font-size: 0.8125rem;
}

.focus-done-list {
  margin-top: 0.375rem;
}

.focus-done-row {
  display: flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
}

.focus-done-row:hover {
  background: var(--color-surface-hover);
}

.focus-picker {
  display: flex;
  width: min(42rem, calc(100vw - 2rem));
  max-height: min(42rem, calc(100vh - 4rem));
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-background);
}

.focus-picker-header,
.focus-picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.focus-picker-list {
  min-height: 18rem;
  overflow-y: auto;
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
}

.focus-picker-row {
  display: flex;
  min-height: 2.25rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
}

.focus-picker-row:hover {
  background: var(--color-surface-hover);
}

@media (max-width: 768px) {
  .focus-drawer-panel,
  .focus-drawer--expanded .focus-drawer-panel {
    width: calc(100vw - 1rem);
  }

  .focus-drawer-tab {
    right: 0.5rem;
  }

  .focus-sort-button span {
    display: none;
  }
}
</style>
