import { invokeCommand } from '../core/invoker';

import type { FocusMemo } from '~/models/focusMemo';

export const focusMemoCommand = {
  list: async (workspaceSlug: string) => {
    return await invokeCommand<FocusMemo[]>('list_focus_memos', {
      workspace_slug_name: workspaceSlug,
    });
  },

  add: async (workspaceSlug: string, memoSlug: string) => {
    await invokeCommand('add_focus_memo', {
      workspace_slug_name: workspaceSlug,
      memo_slug_title: memoSlug,
    });
  },

  delete: async (workspaceSlug: string, memoSlug: string) => {
    await invokeCommand('delete_focus_memo', {
      workspace_slug_name: workspaceSlug,
      memo_slug_title: memoSlug,
    });
  },

  markDoneForToday: async (workspaceSlug: string, memoSlug: string) => {
    await invokeCommand('mark_focus_memo_done_for_today', {
      workspace_slug_name: workspaceSlug,
      memo_slug_title: memoSlug,
    });
  },

  clearDoneForToday: async (workspaceSlug: string, memoSlug: string) => {
    await invokeCommand('clear_focus_memo_done_for_today', {
      workspace_slug_name: workspaceSlug,
      memo_slug_title: memoSlug,
    });
  },
};
