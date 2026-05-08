import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

type ToggleMemoBookmarkInput = {
  workspaceSlug: string;
  memoSlug: string;
  isBookmarked: boolean;
};

export async function toggleMemoBookmark(input: ToggleMemoBookmarkInput) {
  if (!input.isBookmarked) {
    await command.bookmark.add(input.workspaceSlug, input.memoSlug);
  }
  else {
    await command.bookmark.delete(input.workspaceSlug, input.memoSlug);
  }

  emitEvent('bookmark/updated', { workspaceSlug: input.workspaceSlug });
}
