import { computed } from 'vue';

import type { MemoIndexItem } from '~/models/memo';

import { useRoute } from '#imports';
import { workspaceBookmarksQuery } from '~/resources/bookmark/queries';
import { deriveViewModelFlags } from '~/resources/infra/types';
import { workspaceMemosQuery } from '~/resources/memo/queries';
import { workspaceMemoLinkCountsQuery } from '~/resources/memo-link/queries';
import { useQuery } from '~/resources/useQuery';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export type WorkspaceMemosViewModel = {
  data: {
    items: MemoIndexItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

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

export function useWorkspaceMemosViewModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });

  const items = computed<MemoIndexItem[]>(() => memosSnap.value.current ?? []);
  const flags = computed(() => deriveViewModelFlags(memosSnap.value));

  return computed<WorkspaceMemosViewModel>(() => ({
    data: { items: items.value },
    flags: flags.value,
  }));
}

export function useBookmarkListViewModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });
  const { snapshot: bookmarksSnap } = useQuery(workspaceBookmarksQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });
  const { snapshot: memoLinkCountsSnap } = useQuery(workspaceMemoLinkCountsQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });

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
      .filter((memo): memo is BookmarkListItem => memo !== null);
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

  return computed<BookmarkListViewModel>(() => ({
    data: {
      items: items.value,
    },
    flags,
  }));
}
