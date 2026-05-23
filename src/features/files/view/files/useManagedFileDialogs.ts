import { computed, ref } from 'vue';

import type { ComputedRef } from 'vue';
import type { ManagedFileListItem } from '~/models/file';
import type { MemoIndexItem } from '~/models/memo';

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

type UseManagedFileDialogsOptions = {
  items: ComputedRef<ManagedFileListItem[]>;
  memos: ComputedRef<MemoIndexItem[]>;
};

export function useManagedFileDialogs(options: UseManagedFileDialogsOptions) {
  const isCreateModalOpen = ref(false);
  const isEditModalOpen = ref(false);
  const isLinkModalOpen = ref(false);
  const isDetailModalOpen = ref(false);
  const pendingFileId = ref('');
  const pendingEditFileId = ref('');
  const selectedMemoSlug = ref('');
  const selectedMemoCommand = ref<unknown[]>([]);
  const memoSearchQuery = ref('');
  const detailFileId = ref('');
  const createForm = ref({
    displayName: '',
    url: '',
  });
  const editForm = ref({
    displayName: '',
  });

  const memoCommandGroups = computed<MemoCommandGroup[]>(() => [{
    id: 'memos',
    label: 'Notes',
    ignoreFilter: true,
    items: options.memos.value
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

  const pendingFileItem = computed(() =>
    options.items.value.find(item => item.id === pendingFileId.value) ?? null,
  );
  const selectedMemoTitle = computed(() =>
    options.memos.value.find(memo => memo.slug_title === selectedMemoSlug.value)?.title ?? '',
  );

  const openEditModal = (item: ManagedFileListItem) => {
    pendingEditFileId.value = item.id;
    editForm.value.displayName = item.display_name;
    isEditModalOpen.value = true;
  };

  const closeEditModal = () => {
    pendingEditFileId.value = '';
    editForm.value.displayName = '';
    isEditModalOpen.value = false;
  };

  const openLinkModal = (fileId: string) => {
    pendingFileId.value = fileId;
    selectedMemoSlug.value = '';
    selectedMemoCommand.value = [];
    memoSearchQuery.value = '';
    isLinkModalOpen.value = true;
  };

  const closeLinkModal = () => {
    pendingFileId.value = '';
    selectedMemoSlug.value = '';
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

  const openDetailModal = (fileId: string) => {
    detailFileId.value = fileId;
    isDetailModalOpen.value = true;
  };

  const closeDetailModal = () => {
    isDetailModalOpen.value = false;
    detailFileId.value = '';
  };

  return {
    isCreateModalOpen,
    isEditModalOpen,
    isLinkModalOpen,
    isDetailModalOpen,
    pendingFileId,
    pendingEditFileId,
    selectedMemoSlug,
    selectedMemoCommand,
    memoSearchQuery,
    detailFileId,
    createForm,
    editForm,
    memoCommandGroups,
    pendingFileItem,
    selectedMemoTitle,
    openEditModal,
    closeEditModal,
    openLinkModal,
    closeLinkModal,
    onSelectMemoCommand,
    openDetailModal,
    closeDetailModal,
  };
}
