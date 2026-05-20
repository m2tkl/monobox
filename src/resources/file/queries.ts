import type { MemoLinkedFileItem } from '~/models/file';
import type { MemoQueryArgs } from '~/resources/memo/queries';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export const memoFilesQuery = defineQuery<MemoQueryArgs, MemoLinkedFileItem[]>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug, 'files'] as const,
  resources: ({ workspaceSlug, memoSlug }) => [resourceRefs.memo(workspaceSlug, memoSlug)],
  when: ({ workspaceSlug, memoSlug }) => workspaceSlug.length > 0 && memoSlug.length > 0,
  load: ({ workspaceSlug, memoSlug }) => command.file.listFilesForMemo({
    workspaceSlug,
    memoSlug,
  }),
});
