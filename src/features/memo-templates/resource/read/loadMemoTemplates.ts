import { sortMemoTemplates } from '../../template';

import { command } from '~/external/tauri/command';

export async function loadMemoTemplates(workspaceSlug: string) {
  const nextTemplates = await command.memoTemplate.list({ slugName: workspaceSlug });
  return sortMemoTemplates(nextTemplates);
}
