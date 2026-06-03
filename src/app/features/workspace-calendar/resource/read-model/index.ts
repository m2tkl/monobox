import { computed } from 'vue';

import type { ComputedRef } from 'vue';
import type { CalendarDay } from '~/models/calendarDay';
import type { MemoIndexItem } from '~/models/memo';
import type { Milestone } from '~/models/milestone';

import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceCalendarDaysQuery } from '~/resources/calendar-day/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';
import { workspaceMilestonesQuery } from '~/resources/milestone/queries';

export type WorkspaceCalendarReadModel = {
  data: {
    days: CalendarDay[];
    memos: MemoIndexItem[];
    milestones: Milestone[];
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
  const { snapshot: milestonesSnapshot } = useQuery(workspaceMilestonesQuery, {
    workspaceSlug,
    year,
  });

  return defineReadModel<WorkspaceCalendarReadModel['data']>({
    data: computed(() => ({
      days: calendarDaysSnapshot.value.current ?? [],
      memos: memosSnapshot.value.current ?? [],
      milestones: milestonesSnapshot.value.current ?? [],
    })),
    snapshots: [calendarDaysSnapshot, memosSnapshot, milestonesSnapshot],
  });
}
