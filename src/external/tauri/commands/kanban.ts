import { invokeCommand } from '../core/invoker';

import type { Kanban } from '~/models/kanban';

export const kanbanCommand = {
  list: async (workspace: { slugName: string }) => {
    return await invokeCommand<Kanban[]>('list_kanbans', {
      workspace_slug_name: workspace.slugName,
    });
  },

  create: async (params: { workspaceSlugName: string; name: string }) => {
    return await invokeCommand<Kanban>('create_kanban', {
      workspace_slug_name: params.workspaceSlugName,
      name: params.name,
    });
  },

  delete: async (params: { workspaceSlugName: string; id: number }) => {
    await invokeCommand('delete_kanban', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
    });
  },
};
