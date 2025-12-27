import { defineCommand, invokeCommand } from '../core/invoker';

import type { Workspace } from '~/models/workspace';

import { encodeForSlug } from '~/utils/slug';

export const workspaceCommand = {
  list: defineCommand<Workspace[]>('get_workspaces'),

  get: async (workspace: { slugName: string }) => {
    return await invokeCommand<Workspace>('get_workspace', {
      workspace_slug_name: workspace.slugName,
    });
  },

  create: async (workspace: { name: string }) => {
    return await invokeCommand<Workspace>('create_workspace', {
      workspace_slug_name: encodeForSlug(workspace.name),
      workspace_name: workspace.name,
    });
  },

  delete: async (workspace: { slugName: string }) => {
    await invokeCommand('delete_workspace', {
      workspace_slug_name: workspace.slugName,
    });
  },
};
