import type { ComputedRef } from 'vue';

import { workspaceCalendarDaysQuery } from '~/resources/calendar-day/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';
import { workspaceMilestonesQuery } from '~/resources/milestone/queries';

type LoadWorkspaceCalendarDataOptions = {
  workspaceSlug: ComputedRef<string>;
  year: ComputedRef<number>;
};

export async function loadWorkspaceCalendarData(options: LoadWorkspaceCalendarDataOptions) {
  if (!options.workspaceSlug.value) {
    return;
  }

  await Promise.all([
    workspaceCalendarDaysQuery.fetch({
      workspaceSlug: options.workspaceSlug.value,
      year: options.year.value,
    }),
    workspaceMemosQuery.fetch({
      workspaceSlug: options.workspaceSlug.value,
    }),
    workspaceMilestonesQuery.fetch({
      workspaceSlug: options.workspaceSlug.value,
      year: options.year.value,
    }),
  ]);
}
