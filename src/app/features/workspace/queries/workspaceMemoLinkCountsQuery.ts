import type { MemoLinkCount } from '~/models/link';

import { command } from '~/external/tauri/command';
import { defineQuery } from '~/resource-state/query';

export type WorkspaceMemoLinkCountsQueryArgs = {
  workspaceSlug: string;
};

export const workspaceMemoLinkCountsQuery = defineQuery<WorkspaceMemoLinkCountsQueryArgs, MemoLinkCount[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'memo-link-counts'] as const,
  load: ({ workspaceSlug }) => command.link.listCounts(workspaceSlug),
  dependencies: [
    {
      event: 'memo/updated',
      match: (payload, args) => payload.workspaceSlug === args.workspaceSlug,
    },
    {
      event: 'memo/deleted',
      match: (payload, args) => payload.workspaceSlug === args.workspaceSlug,
    },
  ],
});
