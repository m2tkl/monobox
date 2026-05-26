import { computed, ref, watch } from 'vue';

import {
  applyManagedFilesListEvent,
  initialManagedFilesListState,
  type ManagedFilesListEvent,
} from './managedFilesListMachine';
import { loadFilesPageData } from '../../resource/read/loadFilesPageData';
import { useManagedFilesPageReadModel } from '../../resource/read-model';

import type { ComputedRef } from 'vue';

import { handleError } from '~/utils/error';

type UseManagedFilesListStateOptions = {
  workspaceSlug: ComputedRef<string>;
  toast: ReturnType<typeof useToast>;
};

export function useManagedFilesListState(options: UseManagedFilesListStateOptions) {
  const pageSize = 20;
  const state = ref(initialManagedFilesListState);
  const currentPage = computed(() => state.value.currentPage);
  const searchQuery = ref('');
  const showUnlinkedOnly = computed(() => state.value.showUnlinkedOnly);

  const filesReadModel = useManagedFilesPageReadModel(
    options.workspaceSlug,
    currentPage,
    pageSize,
    showUnlinkedOnly,
  );

  const items = computed(() => filesReadModel.value.data.items);
  const totalCount = computed(() => filesReadModel.value.data.totalCount);
  const memos = computed(() => filesReadModel.value.data.memos);
  const isLoading = computed(() => filesReadModel.value.flags.isLoading);
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

  watch(totalPages, (nextTotalPages) => {
    if (currentPage.value > nextTotalPages) {
      state.value = {
        ...state.value,
        currentPage: nextTotalPages,
      };
    }
  });

  const executeLoadPage = async () => {
    try {
      await loadFilesPageData({
        workspaceSlug: options.workspaceSlug,
        currentPage,
        pageSize,
        showUnlinkedOnly,
      });
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to load files.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const dispatch = async (event: ManagedFilesListEvent) => {
    const result = applyManagedFilesListEvent(state.value, event);
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

  const toggleUnlinkedOnly = async () => {
    await dispatch({ type: 'list/unlinked-toggle-requested' });
  };

  return {
    pageSize,
    currentPage,
    searchQuery,
    showUnlinkedOnly,
    items,
    totalCount,
    memos,
    isLoading,
    totalPages,
    pageStart,
    pageEnd,
    filteredItems,
    dispatch,
    loadPage,
    goToPreviousPage,
    goToNextPage,
    toggleUnlinkedOnly,
  };
}
