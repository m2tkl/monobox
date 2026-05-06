import type { Kanban } from '~/models/kanban';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';

export type WorkspaceKanbansQueryArgs = {
  workspaceSlug: string;
};

export const workspaceKanbansQuery = defineQuery<WorkspaceKanbansQueryArgs, Kanban[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'kanbans'] as const,
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.kanban.list({ slugName: workspaceSlug }),
  dependencies: [
    {
      event: 'kanban/updated',
      match: (payload, args) => payload.workspaceSlug === args.workspaceSlug,
    },
  ],
});
