import type { Workspace } from '~/models/workspace';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceQueryArgs = {
  workspaceSlug: string;
};

export const workspaceCollectionQuery = defineQuery<Record<never, never>, Workspace[]>({
  key: () => ['workspace', 'collection'] as const,
  resources: () => [resourceRefs.workspaceCollection()],
  load: () => command.workspace.list(),
});

export const workspaceQuery = defineQuery<WorkspaceQueryArgs, Workspace>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.workspace(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.workspace.get({ slugName: workspaceSlug }),
});
