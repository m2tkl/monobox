import { computed } from 'vue';

import { mergeUniqueMemoItems } from './memoListUtils';

import type { MemoIndexItem } from '~/models/memo';

import { useRoute } from '#imports';
import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceBookmarksQuery } from '~/resources/bookmark/queries';
import { workspaceCalendarDaysQuery } from '~/resources/calendar-day/queries';
import { workspaceFocusDailyStatesQuery } from '~/resources/focus-daily-state/queries';
import { workspaceKanbansQuery } from '~/resources/kanban/queries';
import { kanbanAssignmentItemsQuery } from '~/resources/kanban-assignment/queries';
import { workspaceKanbanStatusesQuery } from '~/resources/kanban-status/queries';
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

export type FocusListItem = MemoIndexItem & {
  linkCount: number;
  orderIndex: number;
};

export type FocusListReadModel = {
  data: {
    items: FocusListItem[];
    activeItems: FocusListItem[];
    doneTodayMemoSlugs: ReadonlySet<string>;
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

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

export type GlobalStatusItem = {
  id: number;
  name: string;
  color?: string | null;
  count: number;
  orderIndex: number;
};

export type GlobalStatusMemoListItem = MemoIndexItem & {
  kanbanId: number;
  kanbanStatusId: number | null;
  linkCount: number;
  orderIndex: number;
  position: number | null;
};

export type GlobalStatusBoardReadModel = {
  data: {
    kanbanId: number | null;
    statuses: GlobalStatusItem[];
    nowItems: GlobalStatusMemoListItem[];
    assignedItems: GlobalStatusMemoListItem[];
    nowStatusId: number | null;
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

export function useFocusDailyStateReadModel() {
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

  const today = new Date().toLocaleDateString('sv-SE');

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

  const doneTodayItems = computed(() => items.value.filter(item => item.doneOn === today));
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

export function useFocusListReadModel() {
  const globalStatusVM = useGlobalStatusBoardReadModel();
  const focusDailyStateVM = useFocusDailyStateReadModel();
  const todayCalendarMemoVM = useTodayCalendarMemoListReadModel();

  const items = computed<FocusListItem[]>(() => {
    const statusItems = globalStatusVM.value.data.nowItems;
    const nowMemoSlugs = new Set(statusItems.map(memo => memo.slug_title));
    const calendarItems = todayCalendarMemoVM.value.data.items
      .filter(memo => !nowMemoSlugs.has(memo.slug_title))
      .map(memo => ({
        ...memo,
        orderIndex: statusItems.length + memo.orderIndex,
      }));

    return mergeUniqueMemoItems<FocusListItem>(statusItems, calendarItems);
  });

  const doneTodayMemoSlugs = computed(() => focusDailyStateVM.value.data.doneTodayMemoSlugs);
  const activeItems = computed(() => items.value.filter(memo => !doneTodayMemoSlugs.value.has(memo.slug_title)));

  return computed<FocusListReadModel>(() => ({
    data: {
      items: items.value,
      activeItems: activeItems.value,
      doneTodayMemoSlugs: doneTodayMemoSlugs.value,
    },
    flags: {
      isLoading: globalStatusVM.value.flags.isLoading
        || focusDailyStateVM.value.flags.isLoading
        || todayCalendarMemoVM.value.flags.isLoading,
      isStale: globalStatusVM.value.flags.isStale
        || focusDailyStateVM.value.flags.isStale
        || todayCalendarMemoVM.value.flags.isStale,
      hasError: globalStatusVM.value.flags.hasError
        || focusDailyStateVM.value.flags.hasError
        || todayCalendarMemoVM.value.flags.hasError,
    },
  }));
}

export function useTodayCalendarMemoListReadModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const today = new Date().toLocaleDateString('sv-SE');
  const year = Number(today.slice(0, 4));

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
    const calendarDay = calendarDaysSnap.value.current?.find(day => day.date === today);
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

export function useGlobalStatusBoardReadModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');

  const { snapshot: kanbansSnap } = useQuery(workspaceKanbansQuery, {
    workspaceSlug,
  });

  const kanban = computed(() => kanbansSnap.value.current?.[0] ?? null);
  const kanbanId = computed(() => kanbansSnap.value.current?.[0]?.id ?? 0);

  const { snapshot: statusesSnap } = useQuery(workspaceKanbanStatusesQuery, {
    workspaceSlug,
    kanbanId,
  });

  const { snapshot: assignmentsSnap } = useQuery(kanbanAssignmentItemsQuery, {
    workspaceSlug,
    kanbanId,
  });

  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  const { snapshot: memoLinkCountsSnap } = useQuery(workspaceMemoLinkCountsQuery, {
    workspaceSlug,
  });

  const counts = computed(() => {
    const next = new Map<number, number>();
    for (const item of assignmentsSnap.value.current ?? []) {
      if (item.kanban_status_id == null) continue;
      next.set(item.kanban_status_id, (next.get(item.kanban_status_id) ?? 0) + 1);
    }
    return next;
  });

  const statuses = computed<GlobalStatusItem[]>(() => {
    return (statusesSnap.value.current ?? []).map(status => ({
      id: status.id,
      name: status.name,
      color: status.color,
      count: counts.value.get(status.id) ?? 0,
      orderIndex: status.order_index,
    }));
  });

  const focusStatusId = computed(() => kanban.value?.focus_status_id ?? null);

  const assignedItems = computed<GlobalStatusMemoListItem[]>(() => {
    const memosById = new Map((memosSnap.value.current ?? []).map(memo => [memo.id, memo]));
    const linkCounts = new Map(
      (memoLinkCountsSnap.value.current ?? []).map(item => [
        item.memo_id,
        {
          directLinkCount: item.direct_link_count,
          backlinkCount: item.backlink_count,
        },
      ]),
    );

    return (assignmentsSnap.value.current ?? [])
      .map((assignment, index) => {
        const memo = memosById.get(assignment.memo_id);
        if (!memo) return null;

        return {
          ...memo,
          kanbanId: assignment.kanban_id,
          kanbanStatusId: assignment.kanban_status_id,
          linkCount: (linkCounts.get(memo.id)?.directLinkCount ?? 0) + (linkCounts.get(memo.id)?.backlinkCount ?? 0),
          orderIndex: index,
          position: assignment.position,
        };
      })
      .filter((item): item is GlobalStatusMemoListItem => item !== null);
  });

  const nowItems = computed(() => {
    if (focusStatusId.value === null) return [];
    return assignedItems.value.filter(item => item.kanbanStatusId === focusStatusId.value);
  });

  return defineReadModel<GlobalStatusBoardReadModel['data']>({
    data: computed(() => ({
      kanbanId: kanbanId.value > 0 ? kanbanId.value : null,
      statuses: statuses.value,
      nowItems: nowItems.value,
      assignedItems: assignedItems.value,
      nowStatusId: focusStatusId.value,
    })),
    snapshots: [kanbansSnap, statusesSnap, assignmentsSnap, memosSnap, memoLinkCountsSnap],
  });
}
