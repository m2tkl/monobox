<template>
  <NuxtLayout name="default">
    <template #main>
      <UContainer class="flex h-full flex-col overflow-hidden py-6">
        <div class="flex min-h-0 flex-1 flex-col gap-6">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold">
              Files
            </h1>

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
          </div>

          <div
            class="min-h-0 flex-1"
          >
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

                <div class="table-toolbar-actions">
                  <AppButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="carbon:renew"
                    @click="loadPage"
                  >
                    Refresh
                  </AppButton>
                  <AppButton
                    size="sm"
                    @click="isCreateModalOpen = true"
                  >
                    Add shared link
                  </AppButton>
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
                        @click="showDetail(row.original.id)"
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

                  <template #related_note_count-cell="{ row }">
                    <span class="text-sm font-medium count-text">
                      {{ row.original.related_note_count }}
                    </span>
                  </template>

                  <template #actions-cell="{ row }">
                    <div class="action-strip">
                      <AppButton
                        variant="outline"
                        size="xs"
                        @click="openEditModal(row.original)"
                      >
                        Rename
                      </AppButton>
                      <AppButton
                        variant="outline"
                        size="xs"
                        @click="openLinkModal(row.original.id)"
                      >
                        Link to note
                      </AppButton>
                      <AppButton
                        variant="ghost"
                        class="delete-action-button"
                        size="xs"
                        :disabled="row.original.related_note_count > 0"
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
      </UContainer>

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
                  @click="createExternalLink"
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
                Rename file
              </div>
            </template>

            <div class="space-y-4">
              <UFormField label="Name">
                <AppInput v-model="editForm.displayName" />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <AppButton
                  color="neutral"
                  variant="ghost"
                  @click="closeEditModal"
                >
                  Cancel
                </AppButton>
                <AppButton
                  :loading="isSubmitting"
                  :disabled="!pendingEditFileId || !editForm.displayName.trim()"
                  @click="saveDisplayName"
                >
                  Save
                </AppButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <UModal v-model:open="isLinkModalOpen">
        <template #content>
          <UCard>
            <template #header>
              <div class="space-y-1">
                <div class="text-sm font-semibold">
                  Link to note
                </div>
                <p class="text-sm link-modal-description">
                  Add a managed file link to the end of the selected note.
                </p>
              </div>
            </template>

            <div class="space-y-4">
              <div class="link-summary-card">
                <div class="link-summary-label">
                  File
                </div>
                <div class="link-summary-value">
                  {{ pendingFileItem?.display_name ?? 'Nothing selected' }}
                </div>
              </div>

              <div class="space-y-3">
                <div class="link-summary-label">
                  Note
                </div>

                <UCommandPalette
                  v-model:search-term="memoSearchQuery"
                  v-model="selectedMemoCommand"
                  class="memo-command-palette"
                  :groups="memoCommandGroups"
                  :autoclear="false"
                  icon="carbon:search"
                  placeholder="Search notes"
                  command-attribute="title"
                  :fuse="{ fuseOptions: { includeMatches: true }, resultLimit: 30 }"
                  :empty-state="{
                    icon: 'carbon:search-locate',
                    label: 'No notes found.',
                    queryLabel: 'No matching notes found.',
                  }"
                  @update:model-value="onSelectMemoCommand"
                />

                <div
                  v-if="selectedMemoTitle"
                  class="selected-memo-card"
                >
                  <div class="selected-memo-label">
                    Selected
                  </div>
                  <div class="selected-memo-value">
                    {{ selectedMemoTitle }}
                  </div>
                </div>
              </div>

            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <AppButton
                  color="neutral"
                  variant="ghost"
                  @click="closeLinkModal"
                >
                  Close
                </AppButton>
                <AppButton
                  :loading="isSubmitting"
                  :disabled="!selectedMemoSlug || !pendingFileId"
                  @click="linkToMemo"
                >
                  Link to note
                </AppButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <UModal v-model:open="isDetailModalOpen">
        <template #content>
          <UCard v-if="detail">
            <template #header>
              <div class="text-sm font-semibold">
                {{ detail.display_name }}
              </div>
            </template>

            <div class="space-y-3 text-sm">
              <div><span class="font-semibold">Type:</span> {{ detail.type }}</div>
              <div><span class="font-semibold">Imported:</span> {{ detail.imported_at }}</div>
              <div v-if="detail.relative_path"><span class="font-semibold">Relative path:</span> {{ detail.relative_path }}</div>
              <div v-if="detail.url"><span class="font-semibold">URL:</span> {{ detail.url }}</div>

              <div class="space-y-2">
                <div class="font-semibold">
                  Related notes
                </div>
                <div
                  v-if="detail.related_notes.length === 0"
                  style="color: var(--color-text-muted)"
                >
                  No related notes.
                </div>
                <NuxtLink
                  v-for="note in detail.related_notes"
                  :key="`${note.workspace_slug_name}/${note.memo_slug_title}`"
                  class="block underline"
                  :to="`/${note.workspace_slug_name}/${note.memo_slug_title}`"
                >
                  {{ note.title }}
                </NuxtLink>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <AppButton
                  color="neutral"
                  variant="ghost"
                  @click="isDetailModalOpen = false"
                >
                  Close
                </AppButton>
                <AppButton
                  icon="carbon:launch"
                  @click="openManagedFile(detail.id)"
                >
                  Open
                </AppButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import InboxPanel from './InboxPanel.vue';

import type { ManagedFileDetail, ManagedFileListItem } from '~/models/file';
import type { MemoIndexItem } from '~/models/memo';

import { fileCommand } from '~/resources/file/commands';
import { memoCommand } from '~/resources/memo/commands';
import LoadingSpinner from '~/shared/components/status/LoadingSpinner.vue';
import { handleError } from '~/utils/error';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

type MemoCommandItem = {
  label: string;
  title: string;
  slug: string;
};

type MemoCommandGroup = {
  id: string;
  label: string;
  ignoreFilter?: boolean;
  items: MemoCommandItem[];
};

const route = useRoute();
const router = useRouter();
const toast = useToast();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const activeTab = computed<'files' | 'inbox'>(() => route.query.tab === 'inbox' ? 'inbox' : 'files');

const isLoading = ref(true);
const isSubmitting = ref(false);
const items = ref<ManagedFileListItem[]>([]);
const totalCount = ref(0);
const memos = ref<MemoIndexItem[]>([]);
const detail = ref<ManagedFileDetail | null>(null);
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isLinkModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const inboxPanelRef = ref<{ loadPage: () => Promise<void> } | null>(null);
const pendingFileId = ref('');
const pendingEditFileId = ref('');
const selectedMemoSlug = ref('');
const selectedMemoCommand = ref<unknown[]>([]);
const memoSearchQuery = ref('');
const createForm = reactive({
  displayName: '',
  url: '',
});
const editForm = reactive({
  displayName: '',
});
const pageSize = 20;
const currentPage = ref(1);
const searchQuery = ref('');
const showUnlinkedOnly = ref(false);

const memoOptions = computed(() => memos.value.map(memo => ({
  label: memo.title,
  value: memo.slug_title,
})));
const memoCommandGroups = computed<MemoCommandGroup[]>(() => [{
  id: 'memos',
  label: 'Notes',
  ignoreFilter: true,
  items: memos.value
    .map(memo => ({
      label: memo.title,
      title: memo.title,
      slug: memo.slug_title,
    }))
    .filter((memo) => {
      const needle = memoSearchQuery.value.trim().toLocaleLowerCase('ja-JP');
      if (!needle) {
        return true;
      }

      return memo.title.toLocaleLowerCase('ja-JP').includes(needle)
        || memo.slug.toLocaleLowerCase('ja-JP').includes(needle);
    }),
}]);
const pendingFileItem = computed(() => items.value.find(item => item.id === pendingFileId.value) ?? null);
const selectedMemoTitle = computed(() => memos.value.find(memo => memo.slug_title === selectedMemoSlug.value)?.title ?? '');
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)));
const pageStart = computed(() => totalCount.value === 0 ? 0 : (currentPage.value - 1) * pageSize + 1);
const pageEnd = computed(() => Math.min(totalCount.value, currentPage.value * pageSize));
const filteredItems = computed(() => {
  const needle = searchQuery.value.trim().toLowerCase();
  if (!needle) {
    return items.value;
  }

  return items.value.filter(item =>
    item.display_name.toLowerCase().includes(needle)
    || item.type.toLowerCase().includes(needle),
  );
});
const setActiveTab = async (tab: 'files' | 'inbox') => {
  const nextQuery = {
    ...route.query,
    ...(tab === 'inbox' ? { tab: 'inbox' } : { tab: undefined }),
  };
  await router.replace({
    path: route.path,
    query: nextQuery,
    hash: route.hash,
  });
};
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
    accessorKey: 'related_note_count',
    header: 'Linked notes',
  },
  {
    accessorKey: 'actions',
    header: '',
  },
];

const linkSelectUi = {
  base: 'rounded-[calc(var(--ui-radius)*1.5)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] ring ring-inset ring-[var(--color-border-light)] hover:ring-[var(--color-border-hover)] data-[state=open]:ring-[var(--color-border-hover)]',
  content: 'rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-elevated)] shadow-lg',
  item: 'text-[var(--color-text-primary)]',
};

const loadPage = async () => {
  isLoading.value = true;
  try {
    const [filesPage, workspaceMemos] = await Promise.all([
      fileCommand.listFiles({
        limit: pageSize,
        offset: (currentPage.value - 1) * pageSize,
        unlinkedOnly: showUnlinkedOnly.value,
      }),
      memoCommand.list({ slugName: workspaceSlug.value }),
    ]);
    items.value = filesPage.items;
    totalCount.value = filesPage.total_count;
    memos.value = workspaceMemos;
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to load files.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isLoading.value = false;
  }
};

const reloadInbox = async () => {
  await inboxPanelRef.value?.loadPage();
};

const goToPreviousPage = async () => {
  if (currentPage.value <= 1) {
    return;
  }
  currentPage.value -= 1;
  await loadPage();
};

const goToNextPage = async () => {
  if (currentPage.value >= totalPages.value) {
    return;
  }
  currentPage.value += 1;
  await loadPage();
};

const toggleUnlinkedOnly = async () => {
  showUnlinkedOnly.value = !showUnlinkedOnly.value;
  currentPage.value = 1;
  await loadPage();
};

const openManagedFile = async (fileId: string) => {
  try {
    await fileCommand.openManagedFile(fileId);
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to open file.',
      description: appError.message,
      color: 'error',
    });
  }
};

const createExternalLink = async () => {
  isSubmitting.value = true;
  try {
    await fileCommand.createExternalLink({
      displayName: createForm.displayName,
      url: createForm.url,
    });
    createForm.displayName = '';
    createForm.url = '';
    isCreateModalOpen.value = false;
    toast.add({ title: 'Shared link added.' });
    await loadPage();
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to add shared link.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isSubmitting.value = false;
  }
};

const openEditModal = (item: ManagedFileListItem) => {
  pendingEditFileId.value = item.id;
  editForm.displayName = item.display_name;
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  pendingEditFileId.value = '';
  editForm.displayName = '';
  isEditModalOpen.value = false;
};

const saveDisplayName = async () => {
  if (!pendingEditFileId.value) {
    return;
  }

  isSubmitting.value = true;
  try {
    const updated = await fileCommand.updateDisplayName({
      fileId: pendingEditFileId.value,
      displayName: editForm.displayName,
    });
    if (detail.value?.id === updated.id) {
      detail.value = {
        ...detail.value,
        display_name: updated.display_name,
      };
    }
    closeEditModal();
    toast.add({ title: 'Name updated.' });
    await loadPage();
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to update name.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isSubmitting.value = false;
  }
};

const openLinkModal = (fileId: string) => {
  pendingFileId.value = fileId;
  selectedMemoSlug.value = memos.value[0]?.slug_title ?? '';
  selectedMemoCommand.value = [];
  memoSearchQuery.value = '';
  isLinkModalOpen.value = true;
};

const closeLinkModal = () => {
  pendingFileId.value = '';
  selectedMemoCommand.value = [];
  memoSearchQuery.value = '';
  isLinkModalOpen.value = false;
};

const onSelectMemoCommand = (command: unknown) => {
  if (!command || typeof command !== 'object' || !('slug' in command) || typeof command.slug !== 'string') {
    return;
  }

  selectedMemoSlug.value = command.slug;
  selectedMemoCommand.value = [];
};

const linkToMemo = async () => {
  if (!pendingFileId.value || !selectedMemoSlug.value) {
    return;
  }

  isSubmitting.value = true;
  try {
    await fileCommand.linkFileToMemo({
      workspaceSlug: workspaceSlug.value,
      memoSlug: selectedMemoSlug.value,
      fileId: pendingFileId.value,
    });
    toast.add({ title: 'Linked to note.' });
    closeLinkModal();
    await loadPage();
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to link to note.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isSubmitting.value = false;
  }
};

const showDetail = async (fileId: string) => {
  try {
    detail.value = await fileCommand.getFileDetail(fileId);
    isDetailModalOpen.value = true;
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to load details.',
      description: appError.message,
      color: 'error',
    });
  }
};

const removeRecord = async (fileId: string) => {
  isSubmitting.value = true;
  try {
    await fileCommand.deleteFileRecord(fileId);
    toast.add({ title: 'File removed.' });
    await loadPage();
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to remove file.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  if (activeTab.value === 'files') {
    void loadPage();
  }
});

watch(activeTab, (tab) => {
  if (tab === 'files') {
    void loadPage();
  }
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

.type-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.count-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.action-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
  padding: 0;
}

.delete-action-button {
  color: var(--color-text-secondary);
}

.delete-action-button:hover:not(:disabled) {
  color: #b91c1c;
  background-color: color-mix(in srgb, #fecaca 52%, transparent);
}

.file-name-button {
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.18s ease;
}

.file-name-button:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--color-primary-hover) 55%, transparent);
  text-underline-offset: 0.16em;
}

.link-modal-description {
  color: var(--color-text-secondary);
}

.link-summary-card {
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--color-surface-muted) 88%, var(--color-background));
}

.link-summary-label {
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.link-summary-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.link-summary-caption {
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.link-empty-hint {
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--color-surface) 78%, transparent);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.memo-command-palette {
  min-height: calc(60vh);
  max-height: calc(60vh);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--color-surface-elevated) 92%, var(--color-background));
}

.memo-command-palette :deep([data-slot='input']) {
  border-bottom: 1px solid var(--color-border-light);
}

.selected-memo-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 0.95rem;
  border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border-light));
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--color-primary-light) 18%, var(--color-surface-elevated));
}

.selected-memo-label {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-primary);
}

.selected-memo-value {
  min-width: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text-primary);
}
</style>
