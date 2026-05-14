import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { command } from '~/resources/command';
import { changeRefs } from '~/resources/changes';

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

  void publishResourceChanges([
    changeRefs.bookmarkCollectionChanged(input.workspaceSlug),
  ]);
}
