import { workspaceBookmarksQuery } from '~/app/features/workspace/queries/workspaceBookmarksQuery';

export async function loadBookmarkCollection(workspaceSlug: string) {
  return workspaceBookmarksQuery.fetch({ workspaceSlug });
}
