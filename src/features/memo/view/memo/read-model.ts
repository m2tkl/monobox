import { computed } from 'vue';

import type { Link } from '~/models/link';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';

import { useRoute } from '#imports';
import { workspaceBookmarksQuery } from '~/resources/bookmark/queries';
import { deriveViewModelFlags } from '~/resources/infra/types';
import { memoDetailQuery, workspaceMemosQuery } from '~/resources/memo/queries';
import { memoLinksQuery } from '~/resources/memo-link/queries';
import { useQuery } from '~/resources/useQuery';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

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
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');
  const canLoadCurrentMemo = computed(() => workspaceSlug.value.length > 0 && memoSlug.value.length > 0);

  const { snapshot: memoSnap } = useQuery(memoDetailQuery, () => ({
    workspaceSlug: workspaceSlug.value,
    memoSlug: memoSlug.value,
  }), {
    enabled: canLoadCurrentMemo,
  });
  const { snapshot: linksSnap } = useQuery(memoLinksQuery, () => ({
    workspaceSlug: workspaceSlug.value,
    memoSlug: memoSlug.value,
  }), {
    enabled: canLoadCurrentMemo,
  });
  const { snapshot: workspaceMemosSnap } = useQuery(workspaceMemosQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });
  const { snapshot: bookmarksSnap } = useQuery(workspaceBookmarksQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });

  const memo = computed(() => memoSnap.value.current ?? null);
  const links = computed<Link[]>(() => linksSnap.value.current ?? []);
  const workspaceMemos = computed<MemoIndexItem[]>(() => workspaceMemosSnap.value.current ?? []);

  const isBookmarked = computed<boolean>(() => {
    const currentMemo = memo.value;
    if (!currentMemo) return false;
    const bookmarks = bookmarksSnap.value.current ?? [];
    return bookmarks.some(bookmark => bookmark.memo_id === currentMemo.id);
  });

  const flags = computed(() => {
    const memoFlags = deriveViewModelFlags(memoSnap.value);
    const linkFlags = deriveViewModelFlags(linksSnap.value);
    const workspaceMemoFlags = deriveViewModelFlags(workspaceMemosSnap.value);
    const bookmarkFlags = deriveViewModelFlags(bookmarksSnap.value);
    return {
      isLoading: memoFlags.isLoading || linkFlags.isLoading || workspaceMemoFlags.isLoading || bookmarkFlags.isLoading,
      isStale: memoFlags.isStale || linkFlags.isStale || workspaceMemoFlags.isStale || bookmarkFlags.isStale,
      hasError: memoFlags.hasError || linkFlags.hasError || workspaceMemoFlags.hasError || bookmarkFlags.hasError,
    };
  });

  return computed<CurrentMemoViewModel>(() => ({
    data: {
      memo: memo.value,
      links: links.value,
      workspaceMemos: workspaceMemos.value,
      isBookmarked: isBookmarked.value,
    },
    flags: flags.value,
  }));
}
