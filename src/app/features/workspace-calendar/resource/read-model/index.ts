import { computed } from 'vue';

import type { ComputedRef } from 'vue';
import type { CalendarDay } from '~/models/calendarDay';
import type { MemoIndexItem } from '~/models/memo';

import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceCalendarDaysQuery } from '~/resources/calendar-day/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';

export type WorkspaceCalendarReadModel = {
  data: {
    days: CalendarDay[];
    memos: MemoIndexItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useWorkspaceCalendarReadModel(
  workspaceSlug: ComputedRef<string>,
  year: ComputedRef<number>,
) {
  const { snapshot: calendarDaysSnapshot } = useQuery(workspaceCalendarDaysQuery, {
    workspaceSlug,
    year,
  });
  const { snapshot: memosSnapshot } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  return defineReadModel<WorkspaceCalendarReadModel['data']>({
    data: computed(() => ({
      days: calendarDaysSnapshot.value.current ?? [],
      memos: memosSnapshot.value.current ?? [],
    })),
    snapshots: [calendarDaysSnapshot, memosSnapshot],
  });
}
