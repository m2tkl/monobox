import type { MemoIndexItem } from '~/models/memo';

import { command } from '~/external/tauri/command';
import { defineQuery } from '~/resource-state/query';

export type WorkspaceMemoQueryArgs = {
  workspaceSlug: string;
};

export const workspaceMemosQuery = defineQuery<WorkspaceMemoQueryArgs, MemoIndexItem[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'memos'] as const,
  load: ({ workspaceSlug }) =>
    command.memo.list({
      slugName: workspaceSlug,
    }),
  dependencies: [
    {
      event: 'memo/created',
      match: (payload, args) =>
        payload.workspaceSlug === args.workspaceSlug,
    },
    {
      event: 'memo/updated',
      match: (payload, args) =>
        payload.workspaceSlug === args.workspaceSlug,
    },
    {
      event: 'memo/deleted',
      match: (payload, args) =>
        payload.workspaceSlug === args.workspaceSlug,
    },
  ],
});
