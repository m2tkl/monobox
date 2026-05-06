import type { Workspace } from '~/models/workspace';

import { command } from '~/resources/command';
import { defineQuery } from '~/resources/query';

export type WorkspaceQueryArgs = {
  workspaceSlug: string;
};

export const workspaceCollectionQuery = defineQuery<Record<never, never>, Workspace[]>({
  key: () => ['workspace', 'collection'] as const,
  load: () => command.workspace.list(),
  dependencies: [
    {
      event: 'workspace/created',
      match: () => true,
    },
    {
      event: 'workspace/deleted',
      match: () => true,
    },
  ],
});

export const workspaceQuery = defineQuery<WorkspaceQueryArgs, Workspace>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug] as const,
  load: ({ workspaceSlug }) => command.workspace.get({ slugName: workspaceSlug }),
});
