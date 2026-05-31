import { computed } from 'vue';

import type { MemoLinkedFileItem } from '~/models/file';
import type { Link } from '~/models/link';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';

import { useRoute } from '#imports';
import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceBookmarksQuery } from '~/resources/bookmark/queries';
import { workspaceFocusMemosQuery } from '~/resources/focus-memo/queries';
import { memoFilesQuery } from '~/resources/file/queries';
import { memoDetailQuery, workspaceMemosQuery } from '~/resources/memo/queries';
import { memoLinksQuery } from '~/resources/memo-link/queries';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export type CurrentMemoReadModel = {
  data: {
    memo: MemoDetail | null;
    links: Link[];
    linkedFiles: MemoLinkedFileItem[];
    workspaceMemos: MemoIndexItem[];
    isBookmarked: boolean;
    isFocused: boolean;
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useCurrentMemoReadModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

  const { snapshot: memoSnap } = useQuery(memoDetailQuery, {
    workspaceSlug,
    memoSlug,
  });

  const { snapshot: linksSnap } = useQuery(memoLinksQuery, {
    workspaceSlug,
    memoSlug,
  });

  const { snapshot: filesSnap } = useQuery(memoFilesQuery, {
    workspaceSlug,
    memoSlug,
  });

  const { snapshot: workspaceMemosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  const { snapshot: bookmarksSnap } = useQuery(workspaceBookmarksQuery, {
    workspaceSlug,
  });

  const { snapshot: focusMemosSnap } = useQuery(workspaceFocusMemosQuery, {
    workspaceSlug,
  });

  const memo = computed(() => memoSnap.value.current ?? null);
  const links = computed<Link[]>(() => linksSnap.value.current ?? []);
  const linkedFiles = computed<MemoLinkedFileItem[]>(() => filesSnap.value.current ?? []);
  const workspaceMemos = computed<MemoIndexItem[]>(() => workspaceMemosSnap.value.current ?? []);

  const isBookmarked = computed<boolean>(() => {
    const currentMemo = memo.value;
    if (!currentMemo) return false;
    const bookmarks = bookmarksSnap.value.current ?? [];
    return bookmarks.some(bookmark => bookmark.memo_id === currentMemo.id);
  });

  const isFocused = computed<boolean>(() => {
    const currentMemo = memo.value;
    if (!currentMemo) return false;
    const focusMemos = focusMemosSnap.value.current ?? [];
    return focusMemos.some(focusMemo => focusMemo.memo_id === currentMemo.id);
  });

  return defineReadModel<CurrentMemoReadModel['data']>({
    data: computed(() => ({
      memo: memo.value,
      links: links.value,
      linkedFiles: linkedFiles.value,
      workspaceMemos: workspaceMemos.value,
      isBookmarked: isBookmarked.value,
      isFocused: isFocused.value,
    })),
    snapshots: [memoSnap, linksSnap, filesSnap, workspaceMemosSnap, bookmarksSnap, focusMemosSnap],
  });
}
