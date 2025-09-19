import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';
import { readBookmarkCollectionSnapshot } from '../resources/bookmarkCollection';
import { readMemoSnapshot } from '../resources/memo';
import { readMemoCollectionSnapshot } from '../resources/memoCollection';
import { readMemoLinkCollectionSnapshot } from '../resources/memoLinkCollection';

import type { Link } from '~/models/link';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';

export type CurrentMemoViewModel = {
  data: {
    memo: MemoDetail | null;
    links: Link[];
    workspaceMemos: MemoIndexItem[];
    isBookmarked: boolean;
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useCurrentMemoViewModel() {
  const memoSnap = readMemoSnapshot();
  const linksSnap = readMemoLinkCollectionSnapshot();
  const workspaceMemosSnap = readMemoCollectionSnapshot();
  const bookmarksSnap = readBookmarkCollectionSnapshot();

  const memo = computed(() => memoSnap.value.current ?? null);
  const links = computed<Link[]>(() => linksSnap.value.current ?? []);
  const workspaceMemos = computed<MemoIndexItem[]>(() => workspaceMemosSnap.value.current ?? []);

  const isBookmarked = computed<boolean>(() => {
    const m = memo.value;
    if (!m) return false;
    const bs = bookmarksSnap.value.current ?? [];
    return bs.some(b => b.memo_id === m.id);
  });

  const flags = computed(() => {
    const f1 = deriveViewModelFlags(memoSnap.value);
    const f2 = deriveViewModelFlags(linksSnap.value);
    const f3 = deriveViewModelFlags(workspaceMemosSnap.value);
    const f4 = deriveViewModelFlags(bookmarksSnap.value);
    return {
      isLoading: f1.isLoading || f2.isLoading || f3.isLoading || f4.isLoading,
      isStale: f1.isStale || f2.isStale || f3.isStale || f4.isStale,
      hasError: f1.hasError || f2.hasError || f3.hasError || f4.hasError,
    };
  });

  const vm = computed<CurrentMemoViewModel>(() => ({
    data: {
      memo: memo.value,
      links: links.value,
      workspaceMemos: workspaceMemos.value,
      isBookmarked: isBookmarked.value,
    },
    flags: flags.value,
  }));

  return vm;
}
