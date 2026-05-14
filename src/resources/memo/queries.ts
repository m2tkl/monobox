import type { MemoDetail, MemoIndexItem } from '~/models/memo';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type MemoQueryArgs = {
  workspaceSlug: string;
  memoSlug: string;
};

export type WorkspaceMemoQueryArgs = {
  workspaceSlug: string;
};

export const memoDetailQuery = defineQuery<MemoQueryArgs, MemoDetail>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug] as const,
  resources: ({ workspaceSlug, memoSlug }) => [resourceRefs.memo(workspaceSlug, memoSlug)],
  when: ({ workspaceSlug, memoSlug }) => workspaceSlug.length > 0 && memoSlug.length > 0,
  load: ({ workspaceSlug, memoSlug }) => command.memo.get({
    workspaceSlugName: workspaceSlug,
    memoSlugTitle: memoSlug,
  }),
});

export const workspaceMemosQuery = defineQuery<WorkspaceMemoQueryArgs, MemoIndexItem[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'memos'] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.memoCollection(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ workspaceSlug }) => command.memo.list({
    slugName: workspaceSlug,
  }),
});
