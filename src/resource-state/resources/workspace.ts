import { workspaceQuery } from '~/app/features/workspace/queries/workspaceQuery';

export async function loadWorkspace(workspaceSlug: string) {
  return workspaceQuery.fetch({ workspaceSlug });
}
