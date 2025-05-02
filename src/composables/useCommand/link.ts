import { invoke } from '@tauri-apps/api/core';

import type { Link } from '~/models/link';

export const linkCommand = {
  list: async (
    memo: { workspaceSlug: string; memoSlug: string },
  ) => {
    try {
      return await invoke<Array<Link>>('get_links', {
        args: {
          workspace_slug_name: memo.workspaceSlug,
          memo_slug_title: encodeForSlug(memo.memoSlug),
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  create: async (
    memo: { workspaceSlug: string; memoSlug: string },
    targetHref: string,
  ) => {
    const [, _toLinkWorkspaceSlug, toLinkMemoSlug] = targetHref.split('/');
    try {
      const _ = await invoke('create_link', {
        args: {
          workspace_slug_name: memo.workspaceSlug,
          memo_slug_title: encodeForSlug(memo.memoSlug),
          to_memo_slug_title: toLinkMemoSlug,
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  delete: async (
    memo: { workspaceSlug: string; memoSlug: string },
    targetHref: string,
  ) => {
    const [_, linkedWorkspaceSlug, linkedMemoSlug] = targetHref.split('/');
    try {
      const _ = await invoke('delete_link', {
        args: {
          workspace_slug_name: memo.workspaceSlug,
          memo_slug_title: encodeForSlug(memo.memoSlug),
          linked_workspace_slug_name: linkedWorkspaceSlug,
          linked_memo_slug_title: linkedMemoSlug,
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },
};
