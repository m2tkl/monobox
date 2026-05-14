import { workspaceMemoTemplatesQuery } from '~/resources/memo-template/queries';

export async function loadMemoTemplates(workspaceSlug: string) {
  return workspaceMemoTemplatesQuery.fetch({ workspaceSlug });
}
