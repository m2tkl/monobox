import { memoDetailQuery } from '~/resources/memo/queries';

export async function loadSlideMemo(workspaceSlug: string, memoSlug: string) {
  await memoDetailQuery.fetch({
    workspaceSlug,
    memoSlug,
  });
}
