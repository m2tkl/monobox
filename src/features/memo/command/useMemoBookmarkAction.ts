import { command } from '~/resources/command';
import { emitEvent } from '~/resources/infra/eventBus';

type ToggleMemoBookmarkInput = {
  workspaceSlug: string;
  memoSlug: string;
  isBookmarked: boolean;
};

export function useMemoBookmarkAction() {
  const toggleBookmark = async (input: ToggleMemoBookmarkInput) => {
    if (!input.isBookmarked) {
      await command.bookmark.add(input.workspaceSlug, input.memoSlug);
    }
    else {
      await command.bookmark.delete(input.workspaceSlug, input.memoSlug);
    }

    emitEvent('bookmark/updated', { workspaceSlug: input.workspaceSlug });
  };

  return {
    toggleBookmark,
  };
}
