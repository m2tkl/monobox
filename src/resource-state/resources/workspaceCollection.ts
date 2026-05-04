import { workspaceCollectionQuery } from '~/app/features/workspace/queries/workspaceCollectionQuery';

export async function loadWorkspaceCollection() {
  return workspaceCollectionQuery.fetch({});
}
