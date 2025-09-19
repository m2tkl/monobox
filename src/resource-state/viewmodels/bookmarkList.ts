import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';
import { readBookmarkCollectionSnapshot } from '../resources/bookmarkCollection';
import { readMemoCollectionSnapshot } from '../resources/memoCollection';

import type { MemoIndexItem } from '~/models/memo';

export type BookmarkListViewModel = {
  data: {
    items: MemoIndexItem[];
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

  const items = computed<MemoIndexItem[]>(() => {
    const bs = bookmarksSnap.value.current ?? [];
    const ms = memosSnap.value.current ?? [];
    if (bs.length === 0 || ms.length === 0) return [];
    const bookmarkedIds = new Set<number>(bs.map(b => b.memo_id));
    return ms.filter(m => bookmarkedIds.has(m.id));
  });

  const flags = computed(() => {
    const bFlags = deriveViewModelFlags(bookmarksSnap.value);
    const mFlags = deriveViewModelFlags(memosSnap.value);
    return {
      isLoading: bFlags.isLoading || mFlags.isLoading,
      isStale: bFlags.isStale || mFlags.isStale,
      hasError: bFlags.hasError || mFlags.hasError,
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
