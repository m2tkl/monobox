import { invoke } from '@tauri-apps/api/core';

import type { MemoDetail, MemoIndexItem } from '~/models/memo';

export const memoCommand = {
  list: async (workspace: { slugName: string }) => {
    try {
      return await invoke<MemoIndexItem[]>('get_workspace_memos', {
        args: { workspace_slug_name: workspace.slugName },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  create: async (memo: { workspaceSlugName: string; title: string }) => {
    try {
      return await invoke<MemoDetail>('create_memo', {
        args: {
          workspace_slug_name: memo.workspaceSlugName,
          slug_title: encodeForSlug(memo.title),
          title: memo.title,
          content: JSON.stringify(''),
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  get: async (memo: { workspaceSlugName: string; memoSlugTitle: string }) => {
    try {
      return await invoke<MemoDetail>('get_memo', {
        args: {
          workspace_slug_name: memo.workspaceSlugName,
          memo_slug_title: encodeForSlug(memo.memoSlugTitle),
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
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
    try {
      await invoke('save_memo', {
        args: {
          workspace_slug_name: memo.workspaceSlug,
          target_slug_title: encodeForSlug(memo.memoSlug),
          new_slug_title: newMemo.slugTitle,
          new_title: newMemo.title,
          new_content: newMemo.content,
          new_description: newMemo.description,
          new_thumbnail_image: newMemo.thumbnailImage || '',
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  trash: async (memo: { workspaceSlug: string; memoSlug: string }) => {
    try {
      await invoke('delete_memo', {
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
};
