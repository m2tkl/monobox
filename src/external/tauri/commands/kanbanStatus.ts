import { invokeCommand } from '../core/invoker';

import type { KanbanStatus } from '~/models/kanbanStatus';

const normalizeColor = (color?: string) => {
  const trimmed = color?.trim();
  return trimmed ? trimmed : null;
};

export const kanbanStatusCommand = {
  list: async (workspace: { slugName: string; kanbanId?: number }) => {
    return await invokeCommand<KanbanStatus[]>('list_kanban_statuses', {
      workspace_slug_name: workspace.slugName,
      kanban_id: workspace.kanbanId ?? null,
    });
  },

  create: async (params: { workspaceSlugName: string; kanbanId?: number; name: string; color?: string }) => {
    return await invokeCommand<KanbanStatus>('create_kanban_status', {
      workspace_slug_name: params.workspaceSlugName,
      kanban_id: params.kanbanId ?? null,
      name: params.name,
      color: normalizeColor(params.color),
    });
  },

  update: async (params: { workspaceSlugName: string; id: number; name: string; color?: string }) => {
    await invokeCommand('update_kanban_status', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
      name: params.name,
      color: normalizeColor(params.color),
    });
  },

  updateOrders: async (params: { workspaceSlugName: string; updates: { id: number; orderIndex: number }[] }) => {
    await invokeCommand('update_kanban_status_orders', {
      workspace_slug_name: params.workspaceSlugName,
      updates: params.updates.map(update => ({
        id: update.id,
        order_index: update.orderIndex,
      })),
    });
  },

  delete: async (params: { workspaceSlugName: string; id: number }) => {
    await invokeCommand('delete_kanban_status', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
    });
  },
};
