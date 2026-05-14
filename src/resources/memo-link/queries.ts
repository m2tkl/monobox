import type { Link, MemoLinkCount } from '~/models/link';
import type { MemoQueryArgs } from '~/resources/memo/queries';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceMemoLinkCountsQueryArgs = {
  workspaceSlug: string;
};

export const memoLinksQuery = defineQuery<MemoQueryArgs, Link[]>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug, 'links'] as const,
  resources: ({ workspaceSlug, memoSlug }) => [resourceRefs.linkCollection(workspaceSlug, memoSlug)],
  when: ({ workspaceSlug, memoSlug }) => workspaceSlug.length > 0 && memoSlug.length > 0,
  load: ({ workspaceSlug, memoSlug }) => command.link.list({
    workspaceSlug,
    memoSlug,
  }),
});

export const workspaceMemoLinkCountsQuery = defineQuery<WorkspaceMemoLinkCountsQueryArgs, MemoLinkCount[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'memo-link-counts'] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.memoLinkCountCollection(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.link.listCounts(workspaceSlug),
});
