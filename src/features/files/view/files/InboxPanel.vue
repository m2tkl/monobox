<template>
  <div class="flex h-full min-h-0 flex-col">
    <LoadingSpinner v-if="isLoading" />

    <div
      v-else-if="items.length === 0"
      class="rounded-lg border p-6 text-sm"
      style="border-color: var(--color-border-light); color: var(--color-text-muted)"
    >
      No files available in Downloads.
    </div>

    <div
      v-else
      class="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div class="table-toolbar">
        <AppInput
          v-model="searchQuery"
          class="table-search"
          placeholder="Search files"
          size="sm"
          icon="carbon:search"
        />

        <div class="table-toolbar-actions">
          <div class="toolbar-button-slot">
            <AppButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="carbon:renew"
              @click="loadPage"
            >
              Refresh
            </AppButton>
          </div>
        </div>
      </div>

      <div class="table-shell min-h-0 flex-1 overflow-hidden">
        <UTable
          :data="filteredItems"
          :columns="columns"
          sticky
          class="managed-table h-full"
          :ui="{
            root: 'h-full',
            base: 'min-w-full',
            thead: 'managed-table-head',
            th: 'managed-table-th',
            td: 'managed-table-td',
            tbody: 'managed-table-body',
            tr: 'managed-table-row',
          }"
        >
          <template #display_name-cell="{ row }">
            <div class="min-w-0">
              <div class="inbox-file-name truncate">
                {{ row.original.display_name }}
              </div>
            </div>
          </template>

          <template #acquired_at-cell="{ row }">
            <span class="inbox-date-text">
              {{ formatAcquiredAt(row.original.acquired_at) }}
            </span>
          </template>

          <template #actions-cell="{ row }">
            <div class="action-strip">
              <AppButton
                color="neutral"
                variant="outline"
                size="xs"
                icon="carbon:launch"
                @click="openInboxFile(row.original.path)"
              >
                Open
              </AppButton>
              <AppButton
                color="primary"
                variant="soft"
                size="xs"
                @click="openImportModal(row.original.path)"
              >
                Import
              </AppButton>
            </div>
          </template>
        </UTable>
      </div>

      <div
        class="table-footer sticky bottom-0 mt-3 flex items-center justify-between gap-3 px-4 py-3 text-sm"
      >
        <div
          class="flex min-h-8 items-center"
          style="color: var(--color-text-secondary)"
        >
          <template v-if="searchQuery.trim()">
            Showing {{ filteredItems.length }} / {{ totalCount }}
          </template>
          <template v-else>
            {{ pageStart }} - {{ pageEnd }} / {{ totalCount }}
          </template>
        </div>

        <div class="flex items-center gap-2">
          <AppButton
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1"
            @click="goToPreviousPage"
          >
            Prev
          </AppButton>
          <AppButton
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages"
            @click="goToNextPage"
          >
            Next
          </AppButton>
        </div>
      </div>
    </div>

    <FileMemoTargetDialog
      v-model:search-term="memoSearchQuery"
      v-model:selected-command="selectedMemoCommand"
      :open="isLinkModalOpen"
      title="Import file"
      description="Import a file from Inbox. Optionally select a note to add a link at the end of it."
      note-label="Note (optional)"
      action-label="Import"
      :action-disabled="!pendingInboxPath"
      :action-loading="isSubmitting"
      :file-display-name="pendingInboxItem?.display_name ?? ''"
      :selected-memo-title="selectedMemoTitle"
      :groups="memoCommandGroups"
      @close="closeLinkModal"
      @submit="confirmImport"
      @select-command="onSelectMemoCommand"
    />
  </div>
</template>

<script setup lang="ts">
import FileMemoTargetDialog from './FileMemoTargetDialog.vue';
import { useInboxPanel } from './useInboxPanel';

import LoadingSpinner from '~/shared/components/status/LoadingSpinner.vue';

const props = defineProps<{
  workspaceSlug: string;
}>();

const toast = useToast();

const {
  isLoading,
  isSubmitting,
  items,
  totalCount,
  isLinkModalOpen,
  pendingInboxPath,
  selectedMemoCommand,
  memoSearchQuery,
  columns,
  memoCommandGroups,
  pendingInboxItem,
  selectedMemoTitle,
  totalPages,
  currentPage,
  searchQuery,
  pageStart,
  pageEnd,
  filteredItems,
  formatAcquiredAt,
  loadPage,
  goToPreviousPage,
  goToNextPage,
  openInboxFile,
  openImportModal,
  closeLinkModal,
  onSelectMemoCommand,
  confirmImport,
} = useInboxPanel({
  workspaceSlug: props.workspaceSlug,
  toast,
});

defineExpose({
  loadPage,
});
</script>

<style scoped>
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.1rem 0 0.9rem;
}

.table-search {
  width: min(24rem, 100%);
  flex: 0 1 24rem;
}

.table-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-button-slot {
  display: contents;
}

.table-shell {
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  background-color: color-mix(in srgb, var(--color-surface-elevated) 88%, var(--color-background));
}

.table-footer {
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  background-color: color-mix(in srgb, var(--color-surface-muted) 88%, var(--color-background));
}

.managed-table :deep(.managed-table-head) {
  background-color: color-mix(in srgb, var(--color-surface-muted) 92%, var(--color-background));
  backdrop-filter: blur(8px);
}

.managed-table :deep(.managed-table-th) {
  height: 40px;
  color: var(--color-text-secondary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.managed-table :deep(.managed-table-td) {
  padding-top: 0.45rem;
  padding-bottom: 0.45rem;
  color: var(--color-text-primary);
  vertical-align: middle;
}

.managed-table :deep(.managed-table-body) {
  background-color: color-mix(in srgb, var(--color-surface-elevated) 92%, var(--color-background));
}

.managed-table :deep(.managed-table-row) {
  transition: background-color 0.18s ease;
}

.managed-table :deep(.managed-table-row:hover) {
  background-color: color-mix(in srgb, var(--color-surface-hover) 82%, transparent);
}

.inbox-file-name {
  font-size: 0.875rem;
  font-weight: 450;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

.inbox-date-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.action-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
  padding: 0;
}

@media (max-width: 640px) {
  .table-toolbar {
    display: block;
  }

  .table-search {
    max-width: none;
    margin-bottom: 0.75rem;
  }

  .table-toolbar-actions {
    display: block;
  }

  .toolbar-button-slot {
    display: block;
  }

  .toolbar-button-slot :deep(button),
  .toolbar-button-slot :deep(a) {
    width: 100%;
    justify-content: center;
  }
}
</style>
