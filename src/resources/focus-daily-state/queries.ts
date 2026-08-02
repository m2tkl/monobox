import type { FocusDailyState } from '~/models/focusDailyState';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceFocusDailyStatesQueryArgs = {
  workspaceSlug: string;
};

export const workspaceFocusDailyStatesQuery = defineQuery<WorkspaceFocusDailyStatesQueryArgs, FocusDailyState[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'focusDailyStates'] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.focusDailyStateCollection(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.focusDailyState.list(workspaceSlug),
});
