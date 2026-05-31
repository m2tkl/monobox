import type { FocusMemo } from '~/models/focusMemo';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceFocusMemosQueryArgs = {
  workspaceSlug: string;
};

export const workspaceFocusMemosQuery = defineQuery<WorkspaceFocusMemosQueryArgs, FocusMemo[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'focusMemos'] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.focusMemoCollection(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.focusMemo.list(workspaceSlug),
});
