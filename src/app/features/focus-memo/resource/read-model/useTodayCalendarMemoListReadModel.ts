import { computed } from 'vue';

import type { Ref } from 'vue';
import type { MemoIndexItem } from '~/models/memo';

import { useLocalDate } from '~/app/features/workspace-calendar/useLocalDate';
import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceCalendarDaysQuery } from '~/resources/calendar-day/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';
import { workspaceMemoLinkCountsQuery } from '~/resources/memo-link/queries';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export type TodayCalendarMemoListItem = MemoIndexItem & {
  linkCount: number;
  orderIndex: number;
};

export type TodayCalendarMemoListReadModel = {
  data: {
    items: TodayCalendarMemoListItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useTodayCalendarMemoListReadModel(today: Ref<string> = useLocalDate()) {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const year = computed(() => Number(today.value.slice(0, 4)));

  const { snapshot: calendarDaysSnap } = useQuery(workspaceCalendarDaysQuery, {
    workspaceSlug,
    year,
  });

  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  const { snapshot: memoLinkCountsSnap } = useQuery(workspaceMemoLinkCountsQuery, {
    workspaceSlug,
  });

  const items = computed<TodayCalendarMemoListItem[]>(() => {
    const calendarDay = calendarDaysSnap.value.current?.find(day => day.date === today.value);
    if (!calendarDay || calendarDay.memos.length === 0) return [];

    const memosById = new Map((memosSnap.value.current ?? []).map(memo => [memo.id, memo]));
    const linkCounts = new Map(
      (memoLinkCountsSnap.value.current ?? []).map(item => [
        item.memo_id,
        item.direct_link_count + item.backlink_count,
      ]),
    );

    return calendarDay.memos
      .map((calendarMemo, index) => {
        const memo = memosById.get(calendarMemo.id);
        if (!memo) return null;

        return {
          ...memo,
          linkCount: linkCounts.get(memo.id) ?? 0,
          orderIndex: index,
        };
      })
      .filter((memo): memo is TodayCalendarMemoListItem => memo !== null);
  });

  return defineReadModel<TodayCalendarMemoListReadModel['data']>({
    data: computed(() => ({
      items: items.value,
    })),
    snapshots: [calendarDaysSnap, memosSnap, memoLinkCountsSnap],
  });
}
