import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

export const focusMemoCommand = {
  list: (workspaceSlug: string) => tauriCommand.focusMemo.list(workspaceSlug),
  add: async (workspaceSlug: string, memoSlug: string) => {
    await tauriCommand.focusMemo.add(workspaceSlug, memoSlug);
    void publishResourceChanges([changeRefs.focusMemoCollectionChanged(workspaceSlug)]);
  },
  delete: async (workspaceSlug: string, memoSlug: string) => {
    await tauriCommand.focusMemo.delete(workspaceSlug, memoSlug);
    void publishResourceChanges([changeRefs.focusMemoCollectionChanged(workspaceSlug)]);
  },
  markDoneForToday: async (workspaceSlug: string, memoSlug: string) => {
    await tauriCommand.focusMemo.markDoneForToday(workspaceSlug, memoSlug);
    void publishResourceChanges([changeRefs.focusMemoCollectionChanged(workspaceSlug)]);
  },
  clearDoneForToday: async (workspaceSlug: string, memoSlug: string) => {
    await tauriCommand.focusMemo.clearDoneForToday(workspaceSlug, memoSlug);
    void publishResourceChanges([changeRefs.focusMemoCollectionChanged(workspaceSlug)]);
  },
} as const;
