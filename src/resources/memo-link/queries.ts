import type { Link, MemoLinkCount } from '~/models/link';
import type { MemoQueryArgs } from '~/resources/memo/queries';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';

export type WorkspaceMemoLinkCountsQueryArgs = {
  workspaceSlug: string;
};

export const memoLinksQuery = defineQuery<MemoQueryArgs, Link[]>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug, 'links'] as const,
  when: ({ workspaceSlug, memoSlug }) => workspaceSlug.length > 0 && memoSlug.length > 0,
  load: ({ workspaceSlug, memoSlug }) => command.link.list({
    workspaceSlug,
    memoSlug,
  }),
  dependencies: [
    {
      event: 'memo/links-updated',
      match: (payload, args) =>
        payload.workspaceSlug === args.workspaceSlug
        && payload.memoSlug === args.memoSlug,
    },
    {
      event: 'memo/updated',
      match: (payload, args) =>
        payload.workspaceSlug === args.workspaceSlug
        && payload.memoSlug === args.memoSlug,
    },
  ],
});

export const workspaceMemoLinkCountsQuery = defineQuery<WorkspaceMemoLinkCountsQueryArgs, MemoLinkCount[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'memo-link-counts'] as const,
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.link.listCounts(workspaceSlug),
  dependencies: [
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
