import type { ComputedRef, Ref } from 'vue';

import { inboxFilesQuery } from '~/resources/file/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';

type LoadInboxFilesDataOptions = {
  workspaceSlug: Ref<string> | ComputedRef<string>;
  currentPage: Ref<number> | ComputedRef<number>;
  pageSize: number;
};

export async function loadInboxFilesData(options: LoadInboxFilesDataOptions) {
  await Promise.all([
    inboxFilesQuery.fetch({
      limit: options.pageSize,
      offset: (options.currentPage.value - 1) * options.pageSize,
    }),
    workspaceMemosQuery.fetch({
      workspaceSlug: options.workspaceSlug.value,
    }),
  ]);
}
