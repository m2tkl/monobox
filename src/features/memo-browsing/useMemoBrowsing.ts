import { computed, ref } from 'vue';

import { useBookmarkListReadModel, useWorkspaceMemosReadModel } from './read-model';

const PAGE_LOAD_BASE_NUM = 64;

export function useMemoBrowsing() {
  const memosReadModel = useWorkspaceMemosReadModel();
  const bookmarksReadModel = useBookmarkListReadModel();
  const recentMemosDisplayCount = ref(PAGE_LOAD_BASE_NUM);

  const memos = computed(() => memosReadModel.value.data.items);
  const bookmarkedMemoIds = computed(() => bookmarksReadModel.value.data.items.map(memo => memo.id));
  const recentMemos = computed(() => memos.value);
  const limitedRecentMemos = computed(() => recentMemos.value.slice(0, recentMemosDisplayCount.value));
  const hasMoreRecentMemos = computed(() => recentMemos.value.length > recentMemosDisplayCount.value);

  const loadMore = () => {
    recentMemosDisplayCount.value += PAGE_LOAD_BASE_NUM;
  };

  return {
    memosReadModel,
    bookmarksReadModel,
    memos,
    bookmarkedMemoIds,
    recentMemos,
    limitedRecentMemos,
    hasMoreRecentMemos,
    loadMore,
  };
}
