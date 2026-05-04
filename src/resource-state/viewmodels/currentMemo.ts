import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';

import type { Link } from '~/models/link';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';

import { useRoute } from '#imports';
import { memoDetailQuery } from '~/app/features/memo/query/memoDetailQuery';
import { memoLinksQuery } from '~/app/features/memo/query/memoLinksQuery';
import { workspaceMemosQuery } from '~/app/features/memo/query/workspaceMemosQuery';
import { workspaceBookmarksQuery } from '~/app/features/workspace/queries/workspaceBookmarksQuery';
import { useQuery } from '~/resource-state/useQuery';
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
