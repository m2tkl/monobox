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

        <div class="flex items-center gap-2">
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

    <UModal v-model:open="isLinkModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="space-y-1">
              <div class="text-sm font-semibold">
                Import file
              </div>
              <p class="text-sm link-modal-description">
                Import a file from Inbox. Optionally select a note to add a link at the end of it.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="link-summary-card">
              <div class="link-summary-label">
                File
              </div>
              <div class="link-summary-value">
                {{ pendingInboxItem?.display_name ?? 'Nothing selected' }}
              </div>
            </div>

            <div class="space-y-3">
                <div class="link-summary-label">
                  Note (optional)
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
                :disabled="!pendingInboxPath"
                :loading="isSubmitting"
                @click="confirmImport"
              >
                Import
              </AppButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { InboxFileItem } from '~/models/file';
import type { MemoIndexItem } from '~/models/memo';

import { fileCommand } from '~/resources/file/commands';
import { memoCommand } from '~/resources/memo/commands';
import LoadingSpinner from '~/shared/components/status/LoadingSpinner.vue';
import { handleError } from '~/utils/error';

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

const props = defineProps<{
  workspaceSlug: string;
}>();

const toast = useToast();

const isLoading = ref(true);
const isSubmitting = ref(false);
const items = ref<InboxFileItem[]>([]);
const totalCount = ref(0);
const memos = ref<MemoIndexItem[]>([]);
const isLinkModalOpen = ref(false);
const pendingInboxPath = ref<string>('');
const selectedMemoSlug = ref<string>('');
const selectedMemoCommand = ref<unknown[]>([]);
const memoSearchQuery = ref('');
const pageSize = 20;
const currentPage = ref(1);
const searchQuery = ref('');
const columns = [
  {
    accessorKey: 'display_name',
    header: 'Name',
  },
  {
    accessorKey: 'acquired_at',
    header: 'Date',
  },
  {
    accessorKey: 'actions',
    header: '',
  },
];

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
const pendingInboxItem = computed(() => items.value.find(item => item.path === pendingInboxPath.value) ?? null);
const selectedMemoTitle = computed(() => memos.value.find(memo => memo.slug_title === selectedMemoSlug.value)?.title ?? '');
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)));
const pageStart = computed(() => totalCount.value === 0 ? 0 : (currentPage.value - 1) * pageSize + 1);
const pageEnd = computed(() => Math.min(totalCount.value, currentPage.value * pageSize));
const filteredItems = computed(() => {
  const needle = searchQuery.value.trim().toLowerCase();
  if (!needle) {
    return items.value;
  }

  return items.value.filter(item => item.display_name.toLowerCase().includes(needle));
});

const formatAcquiredAt = (value: number) => {
  if (!value) {
    return 'Unknown date';
  }
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const loadPage = async () => {
  isLoading.value = true;
  try {
    const [inboxItems, workspaceMemos] = await Promise.all([
      fileCommand.listInbox({
        limit: pageSize,
        offset: (currentPage.value - 1) * pageSize,
      }),
      memoCommand.list({ slugName: props.workspaceSlug }),
    ]);
    items.value = inboxItems.items;
    totalCount.value = inboxItems.total_count;
    memos.value = workspaceMemos;
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to load Inbox.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isLoading.value = false;
  }
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

const openInboxFile = async (path: string) => {
  await fileCommand.openLocalPath(path);
};

const importFile = async (path: string) => {
  isSubmitting.value = true;
  try {
    await fileCommand.importInboxFile(path);
    toast.add({ title: 'File imported.' });
    await loadPage();
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to import file.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isSubmitting.value = false;
  }
};

const openImportModal = (path: string) => {
  pendingInboxPath.value = path;
  selectedMemoSlug.value = '';
  selectedMemoCommand.value = [];
  memoSearchQuery.value = '';
  isLinkModalOpen.value = true;
};

const closeLinkModal = () => {
  isLinkModalOpen.value = false;
  pendingInboxPath.value = '';
  selectedMemoCommand.value = [];
  memoSearchQuery.value = '';
};

const onSelectMemoCommand = (command: unknown) => {
  if (!command || typeof command !== 'object' || !('slug' in command) || typeof command.slug !== 'string') {
    return;
  }

  selectedMemoSlug.value = command.slug;
  selectedMemoCommand.value = [];
};

const confirmImport = async () => {
  if (!pendingInboxPath.value) {
    return;
  }

  if (!selectedMemoSlug.value) {
    await importFile(pendingInboxPath.value);
    closeLinkModal();
    return;
  }

  isSubmitting.value = true;
  try {
    const file = await fileCommand.importInboxFile(pendingInboxPath.value);
    await fileCommand.linkFileToMemo({
      workspaceSlug: props.workspaceSlug,
      memoSlug: selectedMemoSlug.value,
      fileId: file.id,
    });
    toast.add({ title: 'File imported and linked.' });
    closeLinkModal();
    await loadPage();
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to import and link file.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  void loadPage();
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
  max-width: 20rem;
  width: 100%;
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

.table-shell {
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
</style>
