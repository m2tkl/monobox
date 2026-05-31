import { computed, onMounted, ref, watch } from 'vue';

import {
  applyInboxFilesListEvent,
  initialInboxFilesListState,
  type InboxFilesListEvent,
} from './inboxFilesListMachine';
import { importInboxFile } from '../../resource/command/importInboxFile';
import { linkManagedFileToMemo } from '../../resource/command/linkManagedFileToMemo';
import { openInboxFile as executeOpenInboxFile } from '../../resource/command/openInboxFile';
import { loadInboxFilesData } from '../../resource/read/loadInboxFilesData';
import { useInboxFilesPageReadModel } from '../../resource/read-model';

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

type UseInboxPanelOptions = {
  workspaceSlug: string;
  toast: ReturnType<typeof useToast>;
};

export function useInboxPanel(options: UseInboxPanelOptions) {
  const pageSize = 20;
  const state = ref(initialInboxFilesListState);
  const currentPage = computed(() => state.value.currentPage);
  const searchQuery = ref('');
  const isSubmitting = ref(false);
  const isLinkModalOpen = ref(false);
  const pendingInboxPath = ref('');
  const selectedMemoSlug = ref('');
  const selectedMemoCommand = ref<unknown[]>([]);
  const memoSearchQuery = ref('');

  const readModel = useInboxFilesPageReadModel(
    computed(() => options.workspaceSlug),
    currentPage,
    pageSize,
  );

  const items = computed(() => readModel.value.data.items);
  const totalCount = computed(() => readModel.value.data.totalCount);
  const memos = computed(() => readModel.value.data.memos);
  const isLoading = computed(() => readModel.value.flags.isLoading);

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

  const memoCommandGroups = computed<MemoCommandGroup[]>(() => [{
    id: 'memos',
    label: 'Memos',
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

  watch(totalPages, (nextTotalPages) => {
    if (currentPage.value > nextTotalPages) {
      state.value = {
        currentPage: nextTotalPages,
      };
    }
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

  const executeLoadPage = async () => {
    try {
      await loadInboxFilesData({
        workspaceSlug: computed(() => options.workspaceSlug),
        currentPage,
        pageSize,
      });
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to load Inbox.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const dispatch = async (event: InboxFilesListEvent) => {
    const result = applyInboxFilesListEvent(state.value, event);
    state.value = result.state;

    for (const effect of result.effects) {
      if (effect.type === 'effect/load-page') {
        await executeLoadPage();
      }
    }
  };

  const loadPage = async () => {
    await dispatch({ type: 'list/load-requested' });
  };

  const goToPreviousPage = async () => {
    await dispatch({ type: 'list/previous-page-requested' });
  };

  const goToNextPage = async () => {
    await dispatch({
      type: 'list/next-page-requested',
      payload: { totalPages: totalPages.value },
    });
  };

  const openInboxFile = async (path: string) => {
    try {
      await executeOpenInboxFile(path);
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to open file.',
        description: appError.message,
        color: 'error',
      });
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

    isSubmitting.value = true;
    try {
      const file = await importInboxFile({
        workspaceSlug: options.workspaceSlug,
        sourcePath: pendingInboxPath.value,
      });

      if (selectedMemoSlug.value) {
        await linkManagedFileToMemo({
          workspaceSlug: options.workspaceSlug,
          memoSlug: selectedMemoSlug.value,
          fileId: file.id,
        });
      }

      options.toast.add({
        title: selectedMemoSlug.value ? 'File imported and linked.' : 'File imported.',
      });
      closeLinkModal();
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: selectedMemoSlug.value ? 'Failed to import and link file.' : 'Failed to import file.',
        description: appError.message,
        color: 'error',
      });
    }
    finally {
      isSubmitting.value = false;
    }
  };

  onMounted(() => {
    void dispatch({ type: 'list/load-requested' });
  });

  return {
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
    selectedMemoSlug,
    selectedMemoTitle,
    totalPages,
    currentPage,
    searchQuery,
    pageStart,
    pageEnd,
    filteredItems,
    formatAcquiredAt,
    dispatch,
    loadPage,
    goToPreviousPage,
    goToNextPage,
    openInboxFile,
    openImportModal,
    closeLinkModal,
    onSelectMemoCommand,
    confirmImport,
  };
}
