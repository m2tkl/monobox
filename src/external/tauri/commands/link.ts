import { invokeCommand } from '../core/invoker';

import type { Link, MemoLinkCount } from '~/models/link';

import { encodeForSlug } from '~/utils/slug';

export const normalizeSlugSegment = (segment: string): string => {
  const decoded = (() => {
    try {
      return decodeURIComponent(segment);
    }
    catch {
      return segment;
    }
  })();

  return encodeForSlug(decoded);
};

export const linkCommand = {
  list: async (
    memo: { workspaceSlug: string; memoSlug: string },
  ) => {
    return await invokeCommand<Array<Link>>('get_links', {
      workspace_slug_name: memo.workspaceSlug,
      memo_slug_title: memo.memoSlug,
    });
  },

  listCounts: async (workspaceSlug: string) => {
    return await invokeCommand<Array<MemoLinkCount>>('list_workspace_link_counts', {
      workspace_slug_name: workspaceSlug,
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
      to_memo_slug_title: normalizeSlugSegment(toLinkMemoSlug),
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
      linked_workspace_slug_name: normalizeSlugSegment(linkedWorkspaceSlug),
      linked_memo_slug_title: normalizeSlugSegment(linkedMemoSlug),
    });
  },
};
