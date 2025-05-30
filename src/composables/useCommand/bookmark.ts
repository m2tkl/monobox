import { invoke } from '@tauri-apps/api/core';

import type { Bookmark } from '~/models/bookmark';

export const bookmarkCommand = {
  list: async (workspaceSlug: string) => {
    try {
      const bookmarks = await invoke<Bookmark[]>('list_bookmarks', {
        args: { workspace_slug_name: workspaceSlug },
      });
      return bookmarks;
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  add: async (workspaceSlug: string, memoSlug: string) => {
    try {
      await invoke('add_bookmark', {
        args: {
          workspace_slug_name: workspaceSlug,
          memo_slug_title: encodeForSlug(memoSlug),
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  delete: async (workspaceSlug: string, memoSlug: string) => {
    try {
      await invoke('delete_bookmark', {
        args: {
          workspace_slug_name: workspaceSlug,
          memo_slug_title: encodeForSlug(memoSlug),
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },
};
