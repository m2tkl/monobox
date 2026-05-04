import type { Workspace } from '~/models/workspace';

import { command } from '~/external/tauri/command';
import { defineQuery } from '~/resource-state/query';

export type WorkspaceQueryArgs = {
  workspaceSlug: string;
};

export const workspaceQuery = defineQuery<WorkspaceQueryArgs, Workspace>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug] as const,
  load: ({ workspaceSlug }) => command.workspace.get({ slugName: workspaceSlug }),
});
