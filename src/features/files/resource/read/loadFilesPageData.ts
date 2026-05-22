import type { ComputedRef, Ref } from 'vue';

import { workspaceManagedFilesQuery } from '~/resources/file/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';

type LoadFilesPageDataOptions = {
  workspaceSlug: Ref<string> | ComputedRef<string>;
  currentPage: Ref<number> | ComputedRef<number>;
  pageSize: number;
  showUnlinkedOnly: Ref<boolean> | ComputedRef<boolean>;
};

export async function loadFilesPageData(options: LoadFilesPageDataOptions) {
  if (!options.workspaceSlug.value) {
    return;
  }

  await Promise.all([
    workspaceManagedFilesQuery.fetch({
      workspaceSlug: options.workspaceSlug.value,
      limit: options.pageSize,
      offset: (options.currentPage.value - 1) * options.pageSize,
      unlinkedOnly: options.showUnlinkedOnly.value,
    }),
    workspaceMemosQuery.fetch({
      workspaceSlug: options.workspaceSlug.value,
    }),
  ]);
}
