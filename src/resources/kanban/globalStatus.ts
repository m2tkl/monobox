import type { Kanban } from '~/models/kanban';

import { command } from '~/resources/command';

export async function loadGlobalStatusKanban(workspaceSlug: string): Promise<Kanban | null> {
  return (await command.kanban.list({ slugName: workspaceSlug }))[0] ?? null;
}
