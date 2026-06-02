import { toggleMemoBookmark } from '../../resource/command/toggleMemoBookmark';

import type { ActionResult } from './memoEditingAction';
import type { Ref } from 'vue';
import type { Router } from 'vue-router';

export type UseMemoEditingPageActionsDeps = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  isBookmarked: Ref<boolean>;
  hasMemo: Ref<boolean>;
  router: Router;
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

  return {
    toggleBookmark,
    openSlideMode,
  };
}
