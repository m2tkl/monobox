import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

export const focusDailyStateCommand = {
  list: (workspaceSlug: string) => tauriCommand.focusDailyState.list(workspaceSlug),
  markDoneForToday: async (workspaceSlug: string, memoSlug: string) => {
    await tauriCommand.focusDailyState.markDoneForToday(workspaceSlug, memoSlug);
    void publishResourceChanges([changeRefs.focusDailyStateCollectionChanged(workspaceSlug)]);
  },
  clearDoneForToday: async (workspaceSlug: string, memoSlug: string) => {
    await tauriCommand.focusDailyState.clearDoneForToday(workspaceSlug, memoSlug);
    void publishResourceChanges([changeRefs.focusDailyStateCollectionChanged(workspaceSlug)]);
  },
} as const;
