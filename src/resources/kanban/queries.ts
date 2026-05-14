import type { Kanban } from '~/models/kanban';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceKanbansQueryArgs = {
  workspaceSlug: string;
};

export const workspaceKanbansQuery = defineQuery<WorkspaceKanbansQueryArgs, Kanban[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'kanbans'] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.kanbanCollection(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.kanban.list({ slugName: workspaceSlug }),
});
