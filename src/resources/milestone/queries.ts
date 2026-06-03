import type { Milestone } from '~/models/milestone';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export const workspaceMilestonesQuery = defineQuery<
  { workspaceSlug: string; year: number },
  Milestone[]
>({
  key: ({ workspaceSlug, year }) => ['workspace', workspaceSlug, 'milestones', year] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.milestoneCollection(workspaceSlug)],
  when: ({ workspaceSlug, year }) => workspaceSlug.length > 0 && year > 0,
  load: ({ workspaceSlug, year }) => command.milestone.list({
    workspaceSlugName: workspaceSlug,
    year,
  }),
});
