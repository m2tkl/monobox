import type { Workspace } from '~/models/workspace';

import { command } from '~/external/tauri/command';
import { defineQuery } from '~/resource-state/query';

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
