import { invokeCommand } from './invoker';

import type { Link } from '~/models/link';

export const linkCommand = {
  list: async (
    memo: { workspaceSlug: string; memoSlug: string },
  ) => {
    return await invokeCommand<Array<Link>>('get_links', {
      workspace_slug_name: memo.workspaceSlug,
      memo_slug_title: memo.memoSlug,
    });
  },

  create: async (
    memo: { workspaceSlug: string; memoSlug: string },
    targetHref: string,
  ) => {
    const [, _toLinkWorkspaceSlug, toLinkMemoSlug] = targetHref.split('/');
    await invokeCommand('create_link', {
      workspace_slug_name: memo.workspaceSlug,
      memo_slug_title: memo.memoSlug,
      to_memo_slug_title: toLinkMemoSlug,
    });
  },

  delete: async (
    memo: { workspaceSlug: string; memoSlug: string },
    targetHref: string,
  ) => {
    const [_, linkedWorkspaceSlug, linkedMemoSlug] = targetHref.split('/');
    await invokeCommand('delete_link', {
      workspace_slug_name: memo.workspaceSlug,
      memo_slug_title: memo.memoSlug,
      linked_workspace_slug_name: linkedWorkspaceSlug,
      linked_memo_slug_title: linkedMemoSlug,
    });
  },
};
