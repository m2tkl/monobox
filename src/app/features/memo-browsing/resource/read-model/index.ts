import { computed } from 'vue';

import type { MemoIndexItem } from '~/models/memo';

import { useRoute } from '#imports';
import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceBookmarksQuery } from '~/resources/bookmark/queries';
import { workspaceFocusMemosQuery } from '~/resources/focus-memo/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';
import { workspaceMemoLinkCountsQuery } from '~/resources/memo-link/queries';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export type WorkspaceMemosReadModel = {
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

export type BookmarkListReadModel = {
  data: {
    items: BookmarkListItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export type FocusMemoListItem = MemoIndexItem & {
  focusMemoId: number;
  linkCount: number;
  orderIndex: number;
  doneForTodayOn: string | null | undefined;
};

export type FocusMemoListReadModel = {
  data: {
    items: FocusMemoListItem[];
    activeItems: FocusMemoListItem[];
    doneTodayItems: FocusMemoListItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useWorkspaceMemosReadModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  const items = computed<MemoIndexItem[]>(() => memosSnap.value.current ?? []);
  return defineReadModel<WorkspaceMemosReadModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [memosSnap],
  });
}

export function useBookmarkListReadModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');

  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  const { snapshot: bookmarksSnap } = useQuery(workspaceBookmarksQuery, {
    workspaceSlug,
  });

  const { snapshot: memoLinkCountsSnap } = useQuery(workspaceMemoLinkCountsQuery, {
    workspaceSlug,
  });

  const items = computed<BookmarkListItem[]>(() => {
    const bookmarks = bookmarksSnap.value.current ?? [];
    const memos = memosSnap.value.current ?? [];
    if (bookmarks.length === 0 || memos.length === 0) return [];

    const counts = new Map(
      (memoLinkCountsSnap.value.current ?? []).map(item => [
        item.memo_id,
        {
          directLinkCount: item.direct_link_count,
          backlinkCount: item.backlink_count,
        },
      ]),
    );
    const memosById = new Map(memos.map(memo => [memo.id, memo]));

    return bookmarks
      .map((bookmark) => {
        const memo = memosById.get(bookmark.memo_id);
        if (!memo) return null;

        return {
          ...memo,
          bookmarkId: bookmark.id,
          linkCount: (counts.get(memo.id)?.directLinkCount ?? 0) + (counts.get(memo.id)?.backlinkCount ?? 0),
          orderIndex: bookmark.order_index,
        };
      })
      .filter((memo): memo is BookmarkListItem => memo !== null);
  });

  return defineReadModel<BookmarkListReadModel['data']>({
    data: computed(() => ({
      items: items.value,
    })),
    snapshots: [bookmarksSnap, memosSnap, memoLinkCountsSnap],
  });
}

export function useFocusMemoListReadModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');

  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  const { snapshot: focusMemosSnap } = useQuery(workspaceFocusMemosQuery, {
    workspaceSlug,
  });

  const { snapshot: memoLinkCountsSnap } = useQuery(workspaceMemoLinkCountsQuery, {
    workspaceSlug,
  });

  const today = new Date().toLocaleDateString('sv-SE');

  const items = computed<FocusMemoListItem[]>(() => {
    const focusMemos = focusMemosSnap.value.current ?? [];
    const memos = memosSnap.value.current ?? [];
    if (focusMemos.length === 0 || memos.length === 0) return [];

    const counts = new Map(
      (memoLinkCountsSnap.value.current ?? []).map(item => [
        item.memo_id,
        {
          directLinkCount: item.direct_link_count,
          backlinkCount: item.backlink_count,
        },
      ]),
    );
    const memosById = new Map(memos.map(memo => [memo.id, memo]));

    return focusMemos
      .map((focusMemo) => {
        const memo = memosById.get(focusMemo.memo_id);
        if (!memo) return null;

        return {
          ...memo,
          focusMemoId: focusMemo.id,
          linkCount: (counts.get(memo.id)?.directLinkCount ?? 0) + (counts.get(memo.id)?.backlinkCount ?? 0),
          orderIndex: focusMemo.order_index,
          doneForTodayOn: focusMemo.done_for_today_on,
        };
      })
      .filter((memo): memo is FocusMemoListItem => memo !== null);
  });

  const activeItems = computed(() => items.value.filter(item => item.doneForTodayOn !== today));
  const doneTodayItems = computed(() => items.value.filter(item => item.doneForTodayOn === today));

  return defineReadModel<FocusMemoListReadModel['data']>({
    data: computed(() => ({
      items: items.value,
      activeItems: activeItems.value,
      doneTodayItems: doneTodayItems.value,
    })),
    snapshots: [focusMemosSnap, memosSnap, memoLinkCountsSnap],
  });
}
