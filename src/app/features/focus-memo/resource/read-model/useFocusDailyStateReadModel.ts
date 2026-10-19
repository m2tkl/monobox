import { computed } from 'vue';

import type { Ref } from 'vue';
import type { MemoIndexItem } from '~/models/memo';

import { useLocalDate } from '~/app/features/workspace-calendar/useLocalDate';
import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceFocusDailyStatesQuery } from '~/resources/focus-daily-state/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';
import { workspaceMemoLinkCountsQuery } from '~/resources/memo-link/queries';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export type FocusDailyStateListItem = MemoIndexItem & {
  focusDailyStateId: number;
  linkCount: number;
  orderIndex: number;
  doneOn: string;
};

export type FocusDailyStateReadModel = {
  data: {
    items: FocusDailyStateListItem[];
    doneTodayItems: FocusDailyStateListItem[];
    doneTodayMemoSlugs: ReadonlySet<string>;
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useFocusDailyStateReadModel(today: Ref<string> = useLocalDate()) {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');

  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  const { snapshot: focusDailyStatesSnap } = useQuery(workspaceFocusDailyStatesQuery, {
    workspaceSlug,
  });

  const { snapshot: memoLinkCountsSnap } = useQuery(workspaceMemoLinkCountsQuery, {
    workspaceSlug,
  });

  const items = computed<FocusDailyStateListItem[]>(() => {
    const focusDailyStates = focusDailyStatesSnap.value.current ?? [];
    const memos = memosSnap.value.current ?? [];
    if (focusDailyStates.length === 0 || memos.length === 0) return [];

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

    return focusDailyStates
      .map((focusDailyState, index) => {
        const memo = memosById.get(focusDailyState.memo_id);
        if (!memo) return null;

        return {
          ...memo,
          focusDailyStateId: focusDailyState.id,
          linkCount: (counts.get(memo.id)?.directLinkCount ?? 0) + (counts.get(memo.id)?.backlinkCount ?? 0),
          orderIndex: index,
          doneOn: focusDailyState.done_on,
        };
      })
      .filter((memo): memo is FocusDailyStateListItem => memo !== null);
  });

  const doneTodayItems = computed(() => items.value.filter(item => item.doneOn === today.value));
  const doneTodayMemoSlugs = computed(() => new Set(doneTodayItems.value.map(item => item.slug_title)));

  return defineReadModel<FocusDailyStateReadModel['data']>({
    data: computed(() => ({
      items: items.value,
      doneTodayItems: doneTodayItems.value,
      doneTodayMemoSlugs: doneTodayMemoSlugs.value,
    })),
    snapshots: [focusDailyStatesSnap, memosSnap, memoLinkCountsSnap],
  });
}
