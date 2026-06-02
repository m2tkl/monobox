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

  updateStatusRoles: async (params: { workspaceSlugName: string; id: number; defaultStatusId?: number | null; focusStatusId?: number | null }) => {
    await invokeCommand('update_kanban_status_roles', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
      default_status_id: params.defaultStatusId ?? null,
      focus_status_id: params.focusStatusId ?? null,
    });
  },

  delete: async (params: { workspaceSlugName: string; id: number }) => {
    await invokeCommand('delete_kanban', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
    });
  },
};
