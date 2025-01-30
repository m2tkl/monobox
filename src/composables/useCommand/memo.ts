import { invoke } from '@tauri-apps/api/core';

import type { MemoDetail, MemoIndexItem } from '~/models/memo';

export const memoCommand = {
  list: async (workspace: { slugName: string }) => {
    try {
      const memosIndex = await invoke<MemoIndexItem[]>('get_workspace_memos', {
        args: { workspace_slug_name: workspace.slugName },
      });
      return memosIndex;
    }
    catch (error) {
      console.error('Error fetching memos:', error);
      throw error;
    }
  },

  get: async (memo: { workspaceSlugName: string; memoSlugTitle: string }) => {
    try {
      const memoDetail = await invoke<MemoDetail>('get_memo', {
        args: {
          workspace_slug_name: memo.workspaceSlugName,
          memo_slug_title: encodeForSlug(memo.memoSlugTitle),
        },
      });
      return memoDetail;
    }
    catch (error) {
      console.error('Error fetching memo:', error);
      throw error;
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
      console.log('Memo saved successfully!');
    }
    catch (error) {
      console.error('Falied to save memo:', error);
      throw error;
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
      console.log('Memo deleted successfully!');
    }
    catch (error) {
      console.error('Failed to delete memo:', error);
      throw error;
    }
  },
};
