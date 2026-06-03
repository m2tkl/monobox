import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

const publishCalendarChange = (workspaceSlug: string) => {
  void publishResourceChanges([changeRefs.calendarDayCollectionChanged(workspaceSlug)]);
};

export const calendarDayCommand = {
  list: (params: { workspaceSlugName: string; year: number }) => tauriCommand.calendarDay.list(params),
  update: async (params: {
    workspaceSlugName: string;
    date: string;
    note?: string | null;
    isNonWorking: boolean;
  }) => {
    await tauriCommand.calendarDay.update(params);
    publishCalendarChange(params.workspaceSlugName);
  },
  addMemo: async (params: { workspaceSlugName: string; date: string; memoSlugTitle: string }) => {
    await tauriCommand.calendarDay.addMemo(params);
    publishCalendarChange(params.workspaceSlugName);
  },
  removeMemo: async (params: { workspaceSlugName: string; date: string; memoSlugTitle: string }) => {
    await tauriCommand.calendarDay.removeMemo(params);
    publishCalendarChange(params.workspaceSlugName);
  },
} as const;
