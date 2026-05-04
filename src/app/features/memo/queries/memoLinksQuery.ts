import type { MemoQueryArgs } from './memoDetailQuery';
import type { Link } from '~/models/link';

import { command } from '~/external/tauri/command';
import { defineQuery } from '~/resource-state/query';

export const memoLinksQuery = defineQuery<MemoQueryArgs, Link[]>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug, 'links'] as const,
  load: ({ workspaceSlug, memoSlug }) =>
    command.link.list({
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
