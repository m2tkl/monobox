import { invokeCommand } from '../core/invoker';

import type { CalendarDay } from '~/models/calendarDay';

export const calendarDayCommand = {
  list: async (params: { workspaceSlugName: string; year: number }) => {
    return await invokeCommand<CalendarDay[]>('list_calendar_days', {
      workspace_slug_name: params.workspaceSlugName,
      year: params.year,
    });
  },

  update: async (params: {
    workspaceSlugName: string;
    date: string;
    note?: string | null;
    isNonWorking: boolean;
  }) => {
    await invokeCommand('update_calendar_day', {
      workspace_slug_name: params.workspaceSlugName,
      date: params.date,
      note: params.note ?? null,
      is_non_working: params.isNonWorking,
    });
  },

  addMemo: async (params: { workspaceSlugName: string; date: string; memoSlugTitle: string }) => {
    await invokeCommand('add_calendar_day_memo', {
      workspace_slug_name: params.workspaceSlugName,
      date: params.date,
      memo_slug_title: params.memoSlugTitle,
    });
  },

  removeMemo: async (params: { workspaceSlugName: string; date: string; memoSlugTitle: string }) => {
    await invokeCommand('remove_calendar_day_memo', {
      workspace_slug_name: params.workspaceSlugName,
      date: params.date,
      memo_slug_title: params.memoSlugTitle,
    });
  },
};
