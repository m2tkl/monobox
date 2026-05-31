import { toggleMemoBookmark } from '../../resource/command/toggleMemoBookmark';
import { toggleMemoFocusMemo } from '../../resource/command/toggleMemoFocusMemo';

import type { ActionResult } from './memoEditingAction';
import type { Ref } from 'vue';
import type { Router } from 'vue-router';

export type UseMemoEditingPageActionsDeps = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  isBookmarked: Ref<boolean>;
  isFocused: Ref<boolean>;
  hasMemo: Ref<boolean>;
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

  const openSlideMode = async (): Promise<ActionResult> => {
    await options.router.push(`/${options.workspaceSlug.value}/${options.memoSlug.value}/_slide`);
    return { ok: true, data: undefined };
  };

  const toggleFocusMemo = async (): Promise<ActionResult> => {
    if (!options.hasMemo.value) {
      return { ok: false };
    }

    try {
      await toggleMemoFocusMemo({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
        isFocused: options.isFocused.value,
      });
      return { ok: true, data: undefined };
    }
    catch (error) {
      logger.error(error);
      return { ok: false, error };
    }
  };

  const openKanbanModal = (): ActionResult => {
    options.openKanbanModal();
    return { ok: true, data: undefined };
  };

  return {
    openKanbanModal,
    toggleBookmark,
    toggleFocusMemo,
    openSlideMode,
  };
}
