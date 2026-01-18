<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="kanban-page">
        <LoadingSpinner v-if="isLoading" />

        <div
          v-else
          class="kanban-content"
        >
          <div class="kanban-toolbar">
            <div class="kanban-toolbar-left">
              <div class="kanban-toolbar-title">
                Kanban
              </div>
              <USelect
                v-model="selectedKanbanId"
                :items="kanbanOptions"
                size="xs"
                variant="outline"
                label-key="label"
                value-key="value"
                :disabled="kanbanOptions.length === 0"
                placeholder="Select Kanban"
              />
            </div>
            <div class="kanban-toolbar-actions">
              <AppButton
                size="sm"
                :icon="iconKey.add"
                @click="openCreateKanban"
              >
                New board
              </AppButton>
              <AppButton
                size="sm"
                variant="outline"
                :disabled="selectedKanbanId === null"
                @click="openStatusManager"
              >
                Statuses
              </AppButton>
              <AppButton
                size="sm"
                variant="outline"
                :disabled="selectedKanbanId === null"
                @click="openDeleteKanban"
              >
                Delete board
              </AppButton>
              <AppButton
                size="sm"
                :icon="iconKey.add"
                :disabled="disableAddButton"
                @click="openAddModal"
              >
                Add cards ({{ unassignedTotalCount }})
              </AppButton>
            </div>
          </div>

          <div class="kanban-board-wrap">
            <div
              v-if="!hasKanban"
              class="kanban-empty-board"
            >
              Create a Kanban to get started.
            </div>
            <div
              v-else-if="statuses.length === 0"
              class="kanban-empty-board"
            >
              Add statuses in Settings to show columns.
            </div>
            <KanbanBoard
              v-else
              v-model="columns"
              :columns="columns"
              @drag:drop="handleDrop"
            >
              <template #column-header="{ column }">
                <div class="kanban-column-header">
                  <h3 class="kanban-column-title">
                    {{ column.title }}
                  </h3>
                  <span class="kanban-column-count">
                    {{ column.meta?.displayCount ?? column.items.length }}
                  </span>
                </div>
              </template>

              <template #empty-column="{ column }">
                <div class="kanban-empty">
                  No cards in {{ column.title }}
                </div>
              </template>

              <template #card="{ item, isDragging }">
                <div
                  class="kanban-card"
                  :class="{ 'kanban-card--dragging': isDragging }"
                  @click="openMemo(item.slug)"
                >
                  <div class="kanban-card-header">
                    <div class="kanban-card-title">
                      {{ item.title }}
                    </div>
                  </div>
                  <div
                    v-if="item.description"
                    class="kanban-card-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
              </template>

              <template #placeholder="{ item }">
                <div class="kanban-card kanban-card--placeholder-card">
                  <div class="kanban-card-title">
                    {{ item.title }}
                  </div>
                  <div
                    v-if="item.description"
                    class="kanban-card-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
              </template>
            </KanbanBoard>
          </div>
        </div>

        <UModal v-model:open="isAddModalOpen">
          <template #content>
            <UCard>
              <div class="kanban-add-modal">
                <div class="kanban-add-header">
                  <div class="kanban-add-title">
                    Add cards to Kanban
                  </div>
                  <UInput
                    v-model="addQuery"
                    size="sm"
                    placeholder="Search memos"
                  />
                </div>

                <div class="kanban-add-meta">
                  {{ filteredUnassignedItems.length }} / {{ unassignedTotalCount }} showing
                </div>

                <div
                  v-if="filteredUnassignedItems.length === 0"
                  class="kanban-add-empty"
                >
                  No unassigned memos.
                </div>

                <div
                  v-else
                  class="kanban-add-list"
                >
                  <div
                    v-for="item in filteredUnassignedItems"
                    :key="item.memoId"
                    class="kanban-add-item"
                  >
                    <div class="kanban-add-item-body">
                      <div class="kanban-add-item-title">
                        {{ item.title }}
                      </div>
                      <div
                        v-if="item.description"
                        class="kanban-add-item-description"
                      >
                        {{ item.description }}
                      </div>
                    </div>
                    <UDropdownMenu :items="getAssignMenuItems(item)">
                      <AppButton
                        size="xs"
                        variant="outline"
                        :disabled="isAssigning || statuses.length === 0"
                      >
                        Add
                      </AppButton>
                    </UDropdownMenu>
                  </div>
                </div>
              </div>
            </UCard>
          </template>
        </UModal>

        <UModal v-model:open="isCreateKanbanOpen">
          <template #content>
            <UCard>
              <div class="kanban-add-modal">
                <div class="kanban-add-header">
                  <div class="kanban-add-title">
                    New Kanban board
                  </div>
                </div>
                <UInput
                  v-model="newKanbanName"
                  size="sm"
                  placeholder="Board name"
                />
              </div>
              <template #footer>
                <div class="flex justify-end gap-2">
                  <AppButton @click="isCreateKanbanOpen = false">
                    Cancel
                  </AppButton>
                  <AppButton
                    color="primary"
                    :loading="isCreatingKanban"
                    :disabled="newKanbanName.trim().length === 0 || isCreatingKanban"
                    @click="createKanban"
                  >
                    Create
                  </AppButton>
                </div>
              </template>
            </UCard>
          </template>
        </UModal>

        <ConfirmModal
          v-model:open="deleteKanbanOpen"
          title="Delete Kanban?"
          description="This removes the board and all its assignments."
          confirm-label="Delete"
          :loading="isDeletingKanban"
          @confirm="deleteKanban"
        />

        <UModal v-model:open="isStatusManagerOpen">
          <template #content>
            <UCard>
              <div class="kanban-add-modal">
                <div class="kanban-add-title">
                  Statuses
                </div>
                <KanbanStatusManager
                  :workspace-slug="workspaceSlug"
                  :kanban-id="activeKanbanId"
                />
              </div>
            </UCard>
          </template>
        </UModal>
      </div>
    </template>

    <template #actions>
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

      <div v-if="memos.length > 0">
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

<script setup lang="ts">
import { KanbanBoard } from 'kanvan';
import 'kanvan/dist/style.css';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { MemoIndexItem } from '~/models/memo';

import { buildKanbanColumnsFromEntries } from '~/app/features/kanban/kanbanUtils';
import KanbanStatusManager from '~/app/features/kanban/status/KanbanStatusManager.vue';
import { useKanbanOrdering } from '~/app/features/kanban/useKanbanOrdering';
import { useWorkspaceKanbanBoard } from '~/app/features/kanban/useWorkspaceKanbanBoard';
import SearchPalette from '~/app/features/search/SearchPalette.vue';
import AppButton from '~/app/ui/AppButton.vue';
import ConfirmModal from '~/app/ui/ConfirmModal.vue';
import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import { loadKanbanStatuses } from '~/resource-state/resources/kanbanStatusCollection';
import { loadWorkspaceMemos } from '~/resource-state/resources/memoCollection';
import { useKanbanStatusCollectionViewModel } from '~/resource-state/viewmodels/kanbanStatusCollection';
import { useWorkspaceMemosViewModel } from '~/resource-state/viewmodels/workspaceMemos';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

type AssignableItem = {
  memoId: number;
  slug: string;
  title: string;
  description?: string;
  modifiedAt: string;
};

definePageMeta({
  path: '/:workspace/_kanban',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');

const memosVM = useWorkspaceMemosViewModel();
const memos = computed<MemoIndexItem[]>(() => memosVM.value.data.items);

const {
  kanbanOptions,
  kanbanVM,
  selectedKanbanId,
  activeKanbanId,
  hasKanban,
  entries,
  isEntriesLoading,
  isCreateKanbanOpen,
  newKanbanName,
  isCreatingKanban,
  deleteKanbanOpen,
  isDeletingKanban,
  openCreateKanban,
  createKanban,
  openDeleteKanban,
  deleteKanban,
  reloadKanbans,
} = useWorkspaceKanbanBoard({
  workspaceSlug,
  loadStatuses: loadKanbanStatuses,
  toast,
});

const statusVM = useKanbanStatusCollectionViewModel(activeKanbanId);
const statuses = computed(() => statusVM.value.data.items);
const isLoading = computed(() => {
  return memosVM.value.flags.isLoading
    || kanbanVM.value.flags.isLoading
    || statusVM.value.flags.isLoading
    || isEntriesLoading.value;
});

const columns = ref<ReturnType<typeof buildKanbanColumnsFromEntries>>([]);
const isAddModalOpen = ref(false);
const addQuery = ref('');

const ADD_LIST_LIMIT = 100;

const isStatusManagerOpen = ref(false);

await usePageLoader(async () => {
  if (!workspaceSlug.value) return;
  await Promise.all([
    loadWorkspaceMemos(workspaceSlug.value),
    reloadKanbans(),
  ]);
});

const buildColumns = () => {
  columns.value = buildKanbanColumnsFromEntries(entries.value, statuses.value);
};

watch([entries, statuses], buildColumns, { immediate: true });

const findMemoByItemId = (itemId: string) => {
  const memoId = Number(itemId);
  if (Number.isNaN(memoId)) return null;
  return entries.value.find(entry => entry.memo_id === memoId) ?? null;
};

const getAssignMenuItems = (item: AssignableItem): DropdownMenuItem[][] => {
  if (statuses.value.length === 0) {
    return [[{ label: 'No statuses', disabled: true }]];
  }

  return [
    statuses.value.map(status => ({
      label: status.name,
      onSelect: () => { assignStatus(item, status.id); },
      disabled: isAssigning.value,
    })),
  ];
};

const openAddModal = () => {
  if (disableAddButton.value) return;
  addQuery.value = '';
  isAddModalOpen.value = true;
};

const assignedMemoIds = computed(() => new Set(entries.value.map(entry => entry.memo_id)));

const unassignedItems = computed<AssignableItem[]>(() => {
  return memos.value
    .filter(memo => !assignedMemoIds.value.has(memo.id))
    .sort((a, b) => b.modified_at.localeCompare(a.modified_at))
    .map(memo => ({
      memoId: memo.id,
      slug: memo.slug_title,
      title: memo.title,
      description: memo.description ?? undefined,
      modifiedAt: memo.modified_at,
    }));
});

const unassignedTotalCount = computed(() => unassignedItems.value.length);
const disableAddButton = computed(() => {
  return !hasKanban.value || statuses.value.length === 0 || unassignedTotalCount.value === 0;
});

const filteredUnassignedItems = computed(() => {
  const query = addQuery.value.trim().toLowerCase();
  const items = query.length === 0
    ? unassignedItems.value
    : unassignedItems.value.filter((item) => {
        const title = item.title.toLowerCase();
        const description = item.description?.toLowerCase() ?? '';
        return title.includes(query) || description.includes(query);
      });
  return items.slice(0, ADD_LIST_LIMIT);
});

const openStatusManager = () => {
  if (!hasKanban.value) return;
  isStatusManagerOpen.value = true;
};

const { isAssigning, seedPositionsIfNeeded, handleDrop, assignStatus } = useKanbanOrdering({
  workspaceSlug,
  kanbanId: activeKanbanId,
  entries,
  statuses,
  columns,
  buildColumns,
  findMemoByItemId,
  toast,
  debug: import.meta.env.DEV,
});

watch([entries, statuses, workspaceSlug, activeKanbanId], () => {
  seedPositionsIfNeeded();
});

const openMemo = (slug: string) => {
  if (!workspaceSlug.value) return;
  router.push(`/${workspaceSlug.value}/${slug}`);
};
</script>

<style scoped>
.kanban-page {
  height: 100%;
  padding: 16px;
  background-color: var(--color-background);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 12px;
}

.kanban-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.kanban-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kanban-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.kanban-toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.kanban-board-wrap {
  flex: 1;
  min-height: 0;
  border-radius: 14px;
  overflow: hidden;
  background-color: var(--color-background);
  padding: 0;
}

.kanban-empty-board {
  height: 100%;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  border: 1px dashed var(--color-border-light);
  border-radius: 14px;
}

:deep(.kanban) {
  height: 100%;
  gap: 12px;
  background-color: var(--color-background);
}

:deep(.kanban-column) {
  background-color: var(--color-kanban-column-bg);
  border-radius: 14px;
  box-shadow: none;
  padding: 10px;
}

:deep(.kanban-column[data-drag-over="true"]) {
  box-shadow: none;
}

:deep(.kanban-column__header) {
  background-color: var(--color-kanban-column-bg);
  border-radius: 12px;
  margin: 6px 6px 0;
}

.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
}

.kanban-column-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.kanban-column-count {
  font-size: 11px;
  color: var(--color-text-muted);
  background-color: var(--color-surface-muted);
  padding: 2px 8px;
  border-radius: 999px;
}

:deep(.kanban-column__list) {
  padding: 6px 8px 8px;
  gap: 8px;
}

:deep(.kanban-card--placeholder) {
  border: none;
  background-color: var(--color-card-bg);
}

.kanban-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background-color: var(--color-card-bg);
  color: var(--color-text-primary);
  cursor: pointer;
  max-width: 100%;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.kanban-card--dragging {
  opacity: 0.7;
}

.kanban-card-title {
  font-size: 13px;
  font-weight: 600;
  word-break: break-word;
}

.kanban-card-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  justify-content: space-between;
}

.kanban-card--placeholder-card {
  box-shadow: none;
}

.kanban-card-description {
  font-size: 11px;
  color: var(--color-text-secondary);
  word-break: break-word;
}

.kanban-empty {
  font-size: 11px;
  color: var(--color-text-muted);
  background-color: var(--color-surface-muted);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: center;
}

.kanban-add-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-add-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kanban-add-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.kanban-add-meta {
  font-size: 11px;
  color: var(--color-text-muted);
}

.kanban-add-empty {
  font-size: 12px;
  color: var(--color-text-muted);
}

.kanban-add-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.kanban-add-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  background-color: var(--color-card-bg);
  padding: 10px 12px;
}

.kanban-add-item-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kanban-add-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  word-break: break-word;
}

.kanban-add-item-description {
  font-size: 11px;
  color: var(--color-text-secondary);
  word-break: break-word;
}
</style>
