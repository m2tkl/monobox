import { toggleMemoBookmark } from '../../resource/command/toggleMemoBookmark';

import type { ActionResult } from './memoEditingAction';
import type { Ref } from 'vue';
import type { Router } from 'vue-router';
import type { MemoIndexItem } from '~/models/memo';

export type UseMemoEditingPageActionsDeps = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  isBookmarked: Ref<boolean>;
  hasMemo: Ref<boolean>;
  workspaceMemos: Ref<MemoIndexItem[] | undefined>;
  router: Router;
  openKanbanModal: () => void;
};

export function useMemoEditingPageActions(options: UseMemoEditingPageActionsDeps) {
  const logger = useConsoleLogger('memo-editing/useMemoEditingPageActions');

  const toggleBookmark = async (): Promise<ActionResult> => {
    if (!options.hasMemo.value) {
      return { ok: false };
    }

    try {
      await toggleMemoBookmark({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
        isBookmarked: options.isBookmarked.value,
      });
      return { ok: true, data: undefined };
    }
    catch (error) {
      logger.error(error);
      return { ok: false, error };
    }
  };

  const showRandomMemo = async (): Promise<ActionResult> => {
    const memos = options.workspaceMemos.value;
    if (!memos || memos.length === 0) {
      return { ok: false };
    }

    const randomMemo = memos[Math.floor(Math.random() * memos.length)];
    if (!randomMemo) {
      return { ok: false };
    }

    await options.router.push(`/${options.workspaceSlug.value}/${randomMemo.slug_title}`);
    return { ok: true, data: undefined };
  };

  const openSlideMode = async (): Promise<ActionResult> => {
    await options.router.push(`/${options.workspaceSlug.value}/${options.memoSlug.value}/_slide`);
    return { ok: true, data: undefined };
  };

  const openKanbanModal = (): ActionResult => {
    options.openKanbanModal();
    return { ok: true, data: undefined };
  };

  return {
    openKanbanModal,
    toggleBookmark,
    showRandomMemo,
    openSlideMode,
  };
}
