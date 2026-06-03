import { invokeCommand } from '../core/invoker';

import type { Milestone } from '~/models/milestone';

export const milestoneCommand = {
  list: async (params: { workspaceSlugName: string; year: number }) => {
    return await invokeCommand<Milestone[]>('list_milestones', {
      workspace_slug_name: params.workspaceSlugName,
      year: params.year,
    });
  },
  create: async (params: {
    workspaceSlugName: string;
    date: string;
    title: string;
  }) => {
    await invokeCommand('create_milestone', {
      workspace_slug_name: params.workspaceSlugName,
      date: params.date,
      title: params.title,
    });
  },
  update: async (params: {
    workspaceSlugName: string;
    id: number;
    date: string;
    title: string;
  }) => {
    await invokeCommand('update_milestone', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
      date: params.date,
      title: params.title,
    });
  },
  addMemo: async (params: { workspaceSlugName: string; id: number; memoSlugTitle: string }) => {
    await invokeCommand('add_milestone_memo', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
      memo_slug_title: params.memoSlugTitle,
    });
  },
  removeMemo: async (params: { workspaceSlugName: string; id: number; memoSlugTitle: string }) => {
    await invokeCommand('remove_milestone_memo', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
      memo_slug_title: params.memoSlugTitle,
    });
  },
  setCompleted: async (params: { workspaceSlugName: string; id: number; completed: boolean }) => {
    await invokeCommand('set_milestone_completed', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
      completed: params.completed,
    });
  },
  delete: async (params: { workspaceSlugName: string; id: number }) => {
    await invokeCommand('delete_milestone', {
      workspace_slug_name: params.workspaceSlugName,
      id: params.id,
    });
  },
};
