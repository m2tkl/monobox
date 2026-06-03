import type { ComputedRef } from 'vue';

import { workspaceCalendarDaysQuery } from '~/resources/calendar-day/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';

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
  ]);
}
