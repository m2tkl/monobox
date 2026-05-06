import type { Bookmark } from '~/models/bookmark';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';

export type WorkspaceBookmarksQueryArgs = {
  workspaceSlug: string;
};

export const workspaceBookmarksQuery = defineQuery<WorkspaceBookmarksQueryArgs, Bookmark[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'bookmarks'] as const,
  load: ({ workspaceSlug }) => command.bookmark.list(workspaceSlug),
  dependencies: [
    {
      event: 'bookmark/updated',
      match: (payload, args) => payload.workspaceSlug === args.workspaceSlug,
    },
  ],
});
