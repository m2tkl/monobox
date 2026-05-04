import { workspaceMemoLinkCountsQuery } from '~/app/features/workspace/queries/workspaceMemoLinkCountsQuery';

export async function loadWorkspaceMemoLinkCounts(workspaceSlug: string) {
  return workspaceMemoLinkCountsQuery.fetch({ workspaceSlug });
}
