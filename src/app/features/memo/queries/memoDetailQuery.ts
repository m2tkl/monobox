import type { MemoDetail } from '~/models/memo';

import { command } from '~/external/tauri/command';
import { defineQuery } from '~/resource-state/query';

export type MemoQueryArgs = {
  workspaceSlug: string;
  memoSlug: string;
};

export const memoDetailQuery = defineQuery<MemoQueryArgs, MemoDetail>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug] as const,
  load: ({ workspaceSlug, memoSlug }) =>
    command.memo.get({
      workspaceSlugName: workspaceSlug,
      memoSlugTitle: memoSlug,
    }),
  dependencies: [
    {
      event: 'memo/updated',
      match: (payload, args) =>
        payload.workspaceSlug === args.workspaceSlug
        && payload.memoSlug === args.memoSlug,
    },
  ],
});
