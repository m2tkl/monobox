import { computed, ref } from 'vue';

import { useBookmarkListReadModel, useGlobalStatusBoardReadModel, useWorkspaceMemosReadModel } from '../../resource/read-model';

import { iconKey } from '~/utils/icon';

const PAGE_LOAD_BASE_NUM = 64;

export function useMemoBrowsing() {
  const memosReadModel = useWorkspaceMemosReadModel();
  const bookmarksReadModel = useBookmarkListReadModel();
  const globalStatusReadModel = useGlobalStatusBoardReadModel();
  const recentMemosDisplayCount = ref(PAGE_LOAD_BASE_NUM);
  const route = useRoute();

  const memos = computed(() => memosReadModel.value.data.items);
  const bookmarkedMemoIds = computed(() => bookmarksReadModel.value.data.items.map(memo => memo.id));
  const isBookmarkFilter = computed(() => {
    const raw = route.query.bookmarked;
    return Array.isArray(raw) ? raw[0] === 'true' : raw === 'true';
  });
  const statusFilterName = computed(() => {
    const raw = route.query.status;
    if (Array.isArray(raw)) return raw[0] ?? '';
    return typeof raw === 'string' ? raw : '';
  });
  const statusFilter = computed(() => {
    if (!statusFilterName.value) return null;
    return globalStatusReadModel.value.data.statuses.find(status => status.name === statusFilterName.value) ?? null;
  });
  const statusFilteredMemoIds = computed(() => {
    const status = statusFilter.value;
    if (!status) return new Set<number>();
    return new Set(
      globalStatusReadModel.value.data.assignedItems
        .filter(item => item.kanbanStatusId === status.id)
        .map(item => item.id),
    );
  });
  const recentMemos = computed(() => {
    if (isBookmarkFilter.value) return bookmarksReadModel.value.data.items;
    if (!statusFilterName.value) return memos.value;
    if (!statusFilter.value) return [];
    return memos.value.filter(memo => statusFilteredMemoIds.value.has(memo.id));
  });
  const limitedRecentMemos = computed(() => recentMemos.value.slice(0, recentMemosDisplayCount.value));
  const hasMoreRecentMemos = computed(() => recentMemos.value.length > recentMemosDisplayCount.value);
  const headingLabel = computed(() => {
    if (isBookmarkFilter.value) return 'Bookmarks';
    return statusFilter.value?.name ?? 'Recent';
  });
  const headingIcon = computed(() => isBookmarkFilter.value ? iconKey.bookmarkFilled : iconKey.recent);
  const isLoading = computed(() => {
    return memosReadModel.value.flags.isLoading
      || (isBookmarkFilter.value && bookmarksReadModel.value.flags.isLoading);
  });
  const emptyLabel = computed(() => {
    if (isBookmarkFilter.value) return 'No bookmarked memos';
    if (statusFilterName.value && !statusFilter.value) return 'Status not found';
    if (statusFilter.value) return `No memos in ${statusFilter.value.name}`;
    return 'No recent memos';
  });

  const loadMore = () => {
    recentMemosDisplayCount.value += PAGE_LOAD_BASE_NUM;
  };

  return {
    memosReadModel,
    bookmarksReadModel,
    isLoading,
    memos,
    bookmarkedMemoIds,
    isBookmarkFilter,
    statusFilter,
    statusFilterName,
    recentMemos,
    limitedRecentMemos,
    hasMoreRecentMemos,
    headingLabel,
    headingIcon,
    emptyLabel,
    loadMore,
  };
}
