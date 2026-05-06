import type { MemoDetail, MemoIndexItem } from '~/models/memo';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';

export type MemoQueryArgs = {
  workspaceSlug: string;
  memoSlug: string;
};

export type WorkspaceMemoQueryArgs = {
  workspaceSlug: string;
};

export const memoDetailQuery = defineQuery<MemoQueryArgs, MemoDetail>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug] as const,
  load: ({ workspaceSlug, memoSlug }) => command.memo.get({
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

export const workspaceMemosQuery = defineQuery<WorkspaceMemoQueryArgs, MemoIndexItem[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'memos'] as const,
  load: ({ workspaceSlug }) => command.memo.list({
    slugName: workspaceSlug,
  }),
  dependencies: [
    {
      event: 'memo/created',
      match: (payload, args) => payload.workspaceSlug === args.workspaceSlug,
    },
    {
      event: 'memo/updated',
      match: (payload, args) => payload.workspaceSlug === args.workspaceSlug,
    },
    {
      event: 'memo/deleted',
      match: (payload, args) => payload.workspaceSlug === args.workspaceSlug,
    },
  ],
});
