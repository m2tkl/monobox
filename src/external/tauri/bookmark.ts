import { invokeCommand } from './invoker';

import type { Bookmark } from '~/models/bookmark';

export const bookmarkCommand = {
  list: async (workspaceSlug: string) => {
    return await invokeCommand<Bookmark[]>('list_bookmarks', {
      workspace_slug_name: workspaceSlug,
    });
  },

  add: async (workspaceSlug: string, memoSlug: string) => {
    await invokeCommand('add_bookmark', {
      workspace_slug_name: workspaceSlug,
      memo_slug_title: memoSlug,
    });
  },

  delete: async (workspaceSlug: string, memoSlug: string) => {
    await invokeCommand('delete_bookmark', {
      workspace_slug_name: workspaceSlug,
      memo_slug_title: memoSlug,
    });
  },
};
