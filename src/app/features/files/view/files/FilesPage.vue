<template>
  <NuxtLayout name="default">
    <template #main>
      <AppPageFrame
        contained
        fill
        inner-class="flex h-full flex-col overflow-hidden"
      >
        <div class="flex min-h-0 flex-1 flex-col">
          <AppPageHeader title="Files">
            <template #inline>
              <div
                class="settings-tabs"
                role="tablist"
                aria-label="Managed and inbox tabs"
              >
                <button
                  type="button"
                  class="settings-tab"
                  :class="{ 'settings-tab--active': activeTab === 'files' }"
                  role="tab"
                  :aria-selected="activeTab === 'files'"
                  @click="setActiveTab('files')"
                >
                  Managed
                </button>
                <button
                  type="button"
                  class="settings-tab"
                  :class="{ 'settings-tab--active': activeTab === 'inbox' }"
                  role="tab"
                  :aria-selected="activeTab === 'inbox'"
                  @click="setActiveTab('inbox')"
                >
                  Inbox
                </button>
              </div>
            </template>
          </AppPageHeader>

          <div class="min-h-0 flex-1">
            <InboxPanel
              v-if="activeTab === 'inbox'"
              ref="inboxPanelRef"
              :workspace-slug="workspaceSlug"
            />

            <LoadingSpinner v-else-if="isLoading" />

            <div
              v-else
              class="flex h-full min-h-0 flex-col overflow-hidden"
            >
              <div class="table-toolbar">
                <div class="table-toolbar-left">
                  <AppInput
                    v-model="searchQuery"
                    class="table-search"
                    placeholder="Search files"
                    size="sm"
                    icon="carbon:search"
                  />

                  <div class="toolbar-button-slot">
                    <AppButton
                      :color="showUnlinkedOnly ? 'primary' : 'neutral'"
                      :variant="showUnlinkedOnly ? 'soft' : 'outline'"
                      size="sm"
                      icon="carbon:filter"
                      class="filter-toggle-button"
                      @click="toggleUnlinkedOnly"
                    >
                      Unlinked only
                    </AppButton>
                  </div>
                </div>

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
                  <div class="toolbar-button-slot">
                    <AppButton
                      size="sm"
                      @click="isCreateModalOpen = true"
                    >
                      Add shared link
                    </AppButton>
                  </div>
                </div>
              </div>

              <div
                v-if="items.length === 0"
                class="rounded-lg border p-6 text-sm"
                style="border-color: var(--color-border-light); color: var(--color-text-muted)"
              >
                {{ showUnlinkedOnly ? 'No unlinked files found.' : 'No files have been added yet.' }}
              </div>

              <div
                v-else
                class="table-shell min-h-0 flex-1"
              >
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
                      <button
                        type="button"
                        class="file-name-button truncate text-left text-sm font-semibold"
                        @click="openManagedFile(row.original.id)"
                      >
                        {{ row.original.display_name }}
                      </button>
                    </div>
                  </template>

                  <template #type-cell="{ row }">
                    <span class="type-text">
                      {{ row.original.type === 'external_link' ? 'Link' : 'File' }}
                    </span>
                  </template>

                  <template #related_memo_count-cell="{ row }">
                    <span class="text-sm font-medium count-text">
                      {{ row.original.related_memo_count }}
                    </span>
                  </template>

                  <template #actions-cell="{ row }">
                    <div class="action-strip">
                      <AppButton
                        color="neutral"
                        variant="outline"
                        size="xs"
                        @click="openEditModal(row.original)"
                      >
                        Edit
                      </AppButton>
                      <AppButton
                        color="neutral"
                        variant="outline"
                        size="xs"
                        @click="openLinkModal(row.original.id)"
                      >
                        Link to memo
                      </AppButton>
                      <AppButton
                        color="error"
                        variant="ghost"
                        class="delete-action-button"
                        size="xs"
                        :disabled="row.original.related_memo_count > 0"
                        @click="removeRecord(row.original.id)"
                      >
                        Remove
                      </AppButton>
                    </div>
                  </template>
                </UTable>
              </div>

              <div
                v-if="items.length > 0"
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
          </div>
        </div>
      </AppPageFrame>

      <UModal v-model:open="isCreateModalOpen">
        <template #content>
          <UCard>
            <template #header>
              <div class="text-sm font-semibold">
                Add shared link
              </div>
            </template>

            <div class="space-y-4">
              <UFormField label="Name">
                <AppInput v-model="createForm.displayName" />
              </UFormField>
              <UFormField label="URL">
                <AppInput v-model="createForm.url" />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <AppButton
                  color="neutral"
                  variant="ghost"
                  @click="isCreateModalOpen = false"
                >
                  Cancel
                </AppButton>
                <AppButton
                  :loading="isSubmitting"
                  :disabled="!createForm.displayName || !createForm.url"
                  @click="createManagedLink"
                >
                  Add
                </AppButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <UModal v-model:open="isEditModalOpen">
        <template #content>
          <UCard>
            <template #header>
              <div class="text-sm font-semibold">
                {{ editForm.type === 'external_link' ? 'Edit shared link' : 'Edit file' }}
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-if="isEditDetailLoading"
                class="py-2"
              >
                <LoadingSpinner />
              </div>

              <UFormField label="Name">
                <AppInput v-model="editForm.displayName" />
              </UFormField>

              <div
                v-if="editDetail"
                class="space-y-2 text-sm"
              >
                <div>
                  <span class="font-semibold">Type:</span> {{ editDetail.type }}
                </div>
                <div>
                  <span class="font-semibold">Imported:</span> {{ editDetail.imported_at }}
                </div>
                <div v-if="editDetail.relative_path">
                  <span class="font-semibold">File name:</span> {{ editDetail.relative_path.split('/').at(-1) }}
                </div>
              </div>

              <UFormField
                v-if="editForm.type === 'external_link'"
                label="URL"
              >
                <AppInput v-model="editForm.url" />
              </UFormField>
              <UFormField label="Note">
                <AppTextarea
                  v-model="editForm.note"
                  class="w-full"
                  :rows="4"
                  placeholder="Add a short note about this file"
                />
              </UFormField>

              <div
                v-if="editDetail"
                class="space-y-2 text-sm"
              >
                <div class="font-semibold">
                  Related memos
                </div>
                <div
                  v-if="editDetail.related_memos.length === 0"
                  style="color: var(--color-text-muted)"
                >
                  No related memos.
                </div>
                <NuxtLink
                  v-for="memo in editDetail.related_memos"
                  :key="`${memo.workspace_slug_name}/${memo.memo_slug_title}`"
                  class="block underline"
                  :to="`/${memo.workspace_slug_name}/${memo.memo_slug_title}`"
                >
                  {{ memo.title }}
                </NuxtLink>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <AppButton
                  color="neutral"
                  variant="ghost"
                  @click="closeEditModal"
                >
                  Close
                </AppButton>
                <AppButton
                  v-if="editDetail"
                  color="neutral"
                  variant="outline"
                  icon="carbon:launch"
                  @click="openManagedFile(editDetail.id)"
                >
                  Open
                </AppButton>
                <AppButton
                  :loading="isSubmitting"
                  :disabled="isEditDetailLoading || !pendingEditFileId || !editForm.displayName.trim() || (editForm.type === 'external_link' && !editForm.url.trim())"
                  @click="saveEdit"
                >
                  Save
                </AppButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <FileMemoTargetDialog
        v-model:search-term="memoSearchQuery"
        v-model:selected-command="selectedMemoCommand"
        :open="isLinkModalOpen"
        title="Link to memo"
        description="Add a managed file link to the end of the selected memo."
        memo-label="Memo"
        action-label="Link to memo"
        :action-disabled="!selectedMemoSlug || !pendingFileId"
        :action-loading="isSubmitting"
        :file-display-name="pendingFileItem?.display_name ?? ''"
        :selected-memo-title="selectedMemoTitle"
        :groups="memoCommandGroups"
        @close="closeLinkModal"
        @submit="linkToMemo"
        @select-command="onSelectMemoCommand"
      />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import FileMemoTargetDialog from './FileMemoTargetDialog.vue';
import InboxPanel from './InboxPanel.vue';
import { useFilesPage } from './useFilesPage';

import AppPageFrame from '~/app/elements/layout/AppPageFrame.vue';
import AppPageHeader from '~/app/elements/layout/AppPageHeader.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const columns = [
  {
    accessorKey: 'display_name',
    header: 'Name',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'related_memo_count',
    header: 'Linked memos',
  },
  {
    accessorKey: 'actions',
    header: '',
  },
];

const {
  workspaceSlug,
  activeTab,
  isLoading,
  isSubmitting,
  isEditDetailLoading,
  items,
  totalCount,
  editDetail,
  isCreateModalOpen,
  isEditModalOpen,
  isLinkModalOpen,
  inboxPanelRef,
  pendingFileId,
  pendingEditFileId,
  selectedMemoCommand,
  memoSearchQuery,
  createForm,
  editForm,
  currentPage,
  searchQuery,
  showUnlinkedOnly,
  memoCommandGroups,
  pendingFileItem,
  selectedMemoSlug,
  selectedMemoTitle,
  totalPages,
  pageStart,
  pageEnd,
  filteredItems,
  setActiveTab,
  loadPage,
  goToPreviousPage,
  goToNextPage,
  toggleUnlinkedOnly,
  openManagedFile,
  createManagedLink,
  openEditModal,
  closeEditModal,
  saveEdit,
  openLinkModal,
  closeLinkModal,
  onSelectMemoCommand,
  linkToMemo,
  removeRecord,
} = useFilesPage({
  route,
  router,
  toast,
});
</script>

<style scoped>
.settings-tabs {
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border-radius: 10px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
}

.settings-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  background-color: transparent;
  border: 1px solid transparent;
}

.settings-tab--active {
  color: var(--color-text-primary);
  background-color: var(--color-surface-elevated);
  border-color: var(--color-border-light);
}

.table-shell {
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  background-color: color-mix(in srgb, var(--color-surface-elevated) 88%, var(--color-background));
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.1rem 0 0.9rem;
}

.table-toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1 1 auto;
}

.table-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-search {
  width: min(24rem, 100%);
  flex: 0 1 24rem;
}

.filter-toggle-button {
  flex-shrink: 0;
  white-space: nowrap;
}

.toolbar-button-slot {
  display: contents;
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

.action-strip {
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 0.35rem;
  padding: 0;
  white-space: nowrap;
}

.file-name-button {
  cursor: pointer;
  border-radius: 0.375rem;
  transition: color 0.18s ease, text-decoration-color 0.18s ease;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.18em;
}

.file-name-button:hover,
.file-name-button:focus-visible {
  color: var(--color-primary);
  text-decoration-color: currentColor;
}

@media (max-width: 640px) {
  .table-toolbar {
    display: block;
  }

  .table-toolbar-left {
    display: block;
  }

  .table-search {
    width: 100%;
    margin-bottom: 0.75rem;
  }

  .table-toolbar-actions {
    display: block;
  }

  .toolbar-button-slot {
    display: block;
    margin-bottom: 0.75rem;
  }

  .table-toolbar-actions .toolbar-button-slot:last-child {
    margin-bottom: 0;
  }

  .toolbar-button-slot :deep(button),
  .toolbar-button-slot :deep(a) {
    width: 100%;
    justify-content: center;
  }
}
</style>
