import type { Bookmark } from '~/models/bookmark';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceBookmarksQueryArgs = {
  workspaceSlug: string;
};

export const workspaceBookmarksQuery = defineQuery<WorkspaceBookmarksQueryArgs, Bookmark[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'bookmarks'] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.bookmarkCollection(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.bookmark.list(workspaceSlug),
});
