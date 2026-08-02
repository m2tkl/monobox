import { invokeCommand } from '../core/invoker';

import type { FocusDailyState } from '~/models/focusDailyState';

export const focusDailyStateCommand = {
  list: async (workspaceSlug: string) => {
    return await invokeCommand<FocusDailyState[]>('list_focus_daily_states', {
      workspace_slug_name: workspaceSlug,
    });
  },

  markDoneForToday: async (workspaceSlug: string, memoSlug: string) => {
    await invokeCommand('mark_focus_done_for_today', {
      workspace_slug_name: workspaceSlug,
      memo_slug_title: memoSlug,
    });
  },

  clearDoneForToday: async (workspaceSlug: string, memoSlug: string) => {
    await invokeCommand('clear_focus_done_for_today', {
      workspace_slug_name: workspaceSlug,
      memo_slug_title: memoSlug,
    });
  },
};
