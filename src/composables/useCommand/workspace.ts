import { invoke } from '@tauri-apps/api/core';

import type { Workspace } from '~/models/workspace';

export const workspaceCommand = {
  list: async () => {
    try {
      const workspaces = await invoke<Workspace[]>('get_workspaces');
      return workspaces;
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  get: async (workspace: { slugName: string }) => {
    try {
      const workspaceDetail = await invoke<Workspace>('get_workspace', {
        args: { workspace_slug_name: workspace.slugName },
      });
      return workspaceDetail;
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  create: async (
    workspace: { name: string },
  ) => {
    try {
      const newWorkspace = await invoke<Workspace>('create_workspace', {
        args: {
          workspace_slug_name: encodeForSlug(workspace.name),
          workspace_name: workspace.name,
        },
      });
      return newWorkspace;
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },

  delete: async (
    workspace: { slugName: string },
  ) => {
    try {
      await invoke<Workspace>('delete_workspace', {
        args: {
          workspace_slug_name: workspace.slugName,
        },
      });
    }
    catch (err) {
      const errorInfo = createCommandErrorInfo(err);
      throw new AppError(errorInfo, true);
    }
  },
};
