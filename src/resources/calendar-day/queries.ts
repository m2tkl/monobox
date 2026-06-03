import type { CalendarDay } from '~/models/calendarDay';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceCalendarDaysQueryArgs = {
  workspaceSlug: string;
  year: number;
};

export const workspaceCalendarDaysQuery = defineQuery<WorkspaceCalendarDaysQueryArgs, CalendarDay[]>({
  key: ({ workspaceSlug, year }) => ['workspace', workspaceSlug, 'calendar-days', year] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.calendarDayCollection(workspaceSlug)],
  when: ({ workspaceSlug, year }) => workspaceSlug.length > 0 && year > 0,
  load: ({ workspaceSlug, year }) => command.calendarDay.list({
    workspaceSlugName: workspaceSlug,
    year,
  }),
});
