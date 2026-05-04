import { workspaceKanbansQuery } from '~/app/features/kanban/queries/workspaceKanbansQuery';

export async function loadKanbans(workspaceSlug: string) {
  return workspaceKanbansQuery.fetch({ workspaceSlug });
}
