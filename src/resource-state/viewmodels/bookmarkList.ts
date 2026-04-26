import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';
import { readBookmarkCollectionSnapshot } from '../resources/bookmarkCollection';
import { readMemoCollectionSnapshot } from '../resources/memoCollection';
import { readWorkspaceMemoLinkCountCollectionSnapshot } from '../resources/workspaceMemoLinkCountCollection';

import type { MemoIndexItem } from '~/models/memo';

export type BookmarkListItem = MemoIndexItem & {
  bookmarkId: number;
  linkCount: number;
  orderIndex: number;
};

export type BookmarkListViewModel = {
  data: {
    items: BookmarkListItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

/**
 * Compose bookmarked memo list from bookmark collection + memo collection.
 * - Keeps showing last successful data during loading (stale)
 * - Exposes simple flags for UI
 */
export function useBookmarkListViewModel() {
  const bookmarksSnap = readBookmarkCollectionSnapshot();
  const memosSnap = readMemoCollectionSnapshot();
  const memoLinkCountsSnap = readWorkspaceMemoLinkCountCollectionSnapshot();

  const items = computed<BookmarkListItem[]>(() => {
    const bookmarks = bookmarksSnap.value.current ?? [];
    const memos = memosSnap.value.current ?? [];
    if (bookmarks.length === 0 || memos.length === 0) return [];

    const counts = new Map(
      (memoLinkCountsSnap.value.current ?? []).map(item => [item.memo_id, item.link_count]),
    );
    const memosById = new Map(memos.map(memo => [memo.id, memo]));

    return bookmarks
      .map((bookmark) => {
        const memo = memosById.get(bookmark.memo_id);
        if (!memo) return null;

        return {
          ...memo,
          bookmarkId: bookmark.id,
          linkCount: counts.get(memo.id) ?? 0,
          orderIndex: bookmark.order_index,
        };
      })
      .filter((memo): memo is BookmarkListItem => memo !== null)
      .map(memo => ({
        ...memo,
        bookmarkId: memo.bookmarkId,
        linkCount: memo.linkCount,
        orderIndex: memo.orderIndex,
      }));
  });

  const flags = computed(() => {
    const bookmarkFlags = deriveViewModelFlags(bookmarksSnap.value);
    const memoFlags = deriveViewModelFlags(memosSnap.value);
    const memoLinkCountFlags = deriveViewModelFlags(memoLinkCountsSnap.value);
    return {
      isLoading: bookmarkFlags.isLoading || memoFlags.isLoading || memoLinkCountFlags.isLoading,
      isStale: bookmarkFlags.isStale || memoFlags.isStale || memoLinkCountFlags.isStale,
      hasError: bookmarkFlags.hasError || memoFlags.hasError || memoLinkCountFlags.hasError,
    };
  });

  const vm = computed<BookmarkListViewModel>(() => ({
    data: {
      items: items.value,
    },
    flags: {
      isLoading: flags.value.isLoading,
      isStale: flags.value.isStale,
      hasError: flags.value.hasError,
    },
  }));

  return vm;
}
