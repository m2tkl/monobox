import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

export const bookmarkCommand = {
  list: (workspaceSlug: string) => tauriCommand.bookmark.list(workspaceSlug),
  add: async (workspaceSlug: string, memoSlug: string) => {
    await tauriCommand.bookmark.add(workspaceSlug, memoSlug);
    void publishResourceChanges([changeRefs.bookmarkCollectionChanged(workspaceSlug)]);
  },
  delete: async (workspaceSlug: string, memoSlug: string) => {
    await tauriCommand.bookmark.delete(workspaceSlug, memoSlug);
    void publishResourceChanges([changeRefs.bookmarkCollectionChanged(workspaceSlug)]);
  },
  reorder: async (
    workspaceSlug: string,
    memoSlug: string,
    targetMemoSlug: string,
    position: 'before' | 'after',
  ) => {
    await tauriCommand.bookmark.reorder(workspaceSlug, memoSlug, targetMemoSlug, position);
    void publishResourceChanges([changeRefs.bookmarkCollectionChanged(workspaceSlug)]);
  },
} as const;
