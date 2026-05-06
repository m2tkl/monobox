import type { Kanban } from '~/models/kanban';

import { command } from '~/resources/command';
import { defineQuery } from '~/resource-runtime/query';

export type WorkspaceKanbansQueryArgs = {
  workspaceSlug: string;
};

export const workspaceKanbansQuery = defineQuery<WorkspaceKanbansQueryArgs, Kanban[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'kanbans'] as const,
  load: ({ workspaceSlug }) => command.kanban.list({ slugName: workspaceSlug }),
  dependencies: [
    {
      event: 'kanban/updated',
      match: (payload, args) => payload.workspaceSlug === args.workspaceSlug,
    },
  ],
});
