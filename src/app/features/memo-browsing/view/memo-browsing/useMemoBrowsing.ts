import { computed, ref } from 'vue';

import { MEMO_BROWSING_PAGE_SIZE } from './pagination';
import { useBookmarkListReadModel, useFocusListReadModel, useGlobalStatusBoardReadModel, useWorkspaceMemosReadModel } from '../../resource/read-model';

import { iconKey } from '~/utils/icon';

export function useMemoBrowsing() {
  const memosReadModel = useWorkspaceMemosReadModel();
  const bookmarksReadModel = useBookmarkListReadModel();
  const focusListReadModel = useFocusListReadModel();
  const globalStatusReadModel = useGlobalStatusBoardReadModel();
  const recentMemosDisplayCount = ref(MEMO_BROWSING_PAGE_SIZE);
  const route = useRoute();

  const memos = computed(() => memosReadModel.value.data.items);
  const bookmarkedMemoIds = computed(() => bookmarksReadModel.value.data.items.map(memo => memo.id));
  const isBookmarkFilter = computed(() => {
    if (route.path.endsWith('/_bookmarks')) return true;
    const raw = route.query.bookmarked;
    return Array.isArray(raw) ? raw[0] === 'true' : raw === 'true';
  });
  const isFocusFilter = computed(() => route.path.endsWith('/_focus'));
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
  const doneTodayMemoSlugs = computed(() => focusListReadModel.value.data.doneTodayMemoSlugs);
  const doneTodayFocusItems = computed(() => focusListReadModel.value.data.items
    .filter(memo => doneTodayMemoSlugs.value.has(memo.slug_title)));
  const recentMemos = computed(() => {
    if (isFocusFilter.value) {
      return [...focusListReadModel.value.data.activeItems, ...doneTodayFocusItems.value];
    }
    if (isBookmarkFilter.value) return bookmarksReadModel.value.data.items;
    if (!statusFilterName.value) return memos.value;
    if (!statusFilter.value) return [];
    return memos.value.filter(memo => statusFilteredMemoIds.value.has(memo.id));
  });
  const limitedRecentMemos = computed(() => recentMemos.value.slice(0, recentMemosDisplayCount.value));
  const limitedActiveFocusMemos = computed(() => limitedRecentMemos.value
    .filter(memo => !doneTodayMemoSlugs.value.has(memo.slug_title)));
  const limitedDoneTodayFocusMemos = computed(() => limitedRecentMemos.value
    .filter(memo => doneTodayMemoSlugs.value.has(memo.slug_title)));
  const hasMoreRecentMemos = computed(() => recentMemos.value.length > recentMemosDisplayCount.value);
  const headingLabel = computed(() => {
    if (isFocusFilter.value) return 'Focus';
    if (isBookmarkFilter.value) return 'Bookmarks';
    return statusFilter.value?.name ?? 'Recent';
  });
  const headingIcon = computed(() => {
    if (isFocusFilter.value) return iconKey.focusFilled;
    return isBookmarkFilter.value ? iconKey.bookmarkFilled : iconKey.recent;
  });
  const isLoading = computed(() => {
    return memosReadModel.value.flags.isLoading
      || (isFocusFilter.value && focusListReadModel.value.flags.isLoading)
      || (isBookmarkFilter.value && bookmarksReadModel.value.flags.isLoading);
  });
  const emptyLabel = computed(() => {
    if (isFocusFilter.value) return 'No focus memos';
    if (isBookmarkFilter.value) return 'No bookmarked memos';
    if (statusFilterName.value && !statusFilter.value) return 'Status not found';
    if (statusFilter.value) return `No memos in ${statusFilter.value.name}`;
    return 'No recent memos';
  });

  const loadMore = () => {
    recentMemosDisplayCount.value += MEMO_BROWSING_PAGE_SIZE;
  };

  return {
    memosReadModel,
    bookmarksReadModel,
    isLoading,
    memos,
    bookmarkedMemoIds,
    doneTodayMemoSlugs,
    isBookmarkFilter,
    isFocusFilter,
    statusFilter,
    statusFilterName,
    recentMemos,
    limitedRecentMemos,
    limitedActiveFocusMemos,
    limitedDoneTodayFocusMemos,
    hasMoreRecentMemos,
    headingLabel,
    headingIcon,
    emptyLabel,
    loadMore,
  };
}
