import { invokeCommand } from './invoker';

import type { MemoDetail, MemoIndexItem } from '~/models/memo';

import { encodeForSlug } from '~/utils/slug';

export const memoCommand = {
  list: async (workspace: { slugName: string }) => {
    return await invokeCommand<MemoIndexItem[]>('get_workspace_memos', {
      workspace_slug_name: workspace.slugName,
    });
  },

  create: async (memo: { workspaceSlugName: string; title: string }) => {
    return await invokeCommand<MemoDetail>('create_memo', {
      workspace_slug_name: memo.workspaceSlugName,
      slug_title: encodeForSlug(memo.title),
      title: memo.title,
      content: JSON.stringify(''),
    });
  },

  get: async (memo: { workspaceSlugName: string; memoSlugTitle: string }) => {
    return await invokeCommand<MemoDetail>('get_memo', {
      workspace_slug_name: memo.workspaceSlugName,
      memo_slug_title: memo.memoSlugTitle,
    });
  },

  save: async (
    memo: { workspaceSlug: string; memoSlug: string },
    newMemo: {
      slugTitle: string;
      title: string;
      content: string;
      description: string;
      thumbnailImage?: string;
    },
  ) => {
    await invokeCommand('save_memo', {
      workspace_slug_name: memo.workspaceSlug,
      target_slug_title: memo.memoSlug,
      new_slug_title: newMemo.slugTitle,
      new_title: newMemo.title,
      new_content: newMemo.content,
      new_description: newMemo.description,
      new_thumbnail_image: newMemo.thumbnailImage || '',
    });
  },

  trash: async (memo: { workspaceSlug: string; memoSlug: string }) => {
    await invokeCommand('delete_memo', {
      workspace_slug_name: memo.workspaceSlug,
      memo_slug_title: memo.memoSlug,
    });
  },
};
