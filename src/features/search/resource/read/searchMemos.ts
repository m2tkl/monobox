import { command } from '~/external/tauri/command';

export async function searchMemos(workspaceSlug: string, query: string) {
  return await command.memo.search({
    workspaceSlugName: workspaceSlug,
    query,
    limit: 50,
    offset: 0,
  });
}
