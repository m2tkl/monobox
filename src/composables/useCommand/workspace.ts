import { invoke } from '@tauri-apps/api/core';
import type { Workspace } from '~/models/workspace';

export const workspaceCommand = {
  list: async () => {
    try {
      const workspaces = await invoke<Workspace[]>('get_workspaces');
      return workspaces;
    }
    catch (error) {
      console.error('Failed to get workspaces:', error);
    }
  },

  get: async (workspace: { slugName: string }) => {
    try {
      const workspaceDetail = await invoke<Workspace>('get_workspace', {
        args: { workspace_slug_name: workspace.slugName },
      });
      return workspaceDetail;
    }
    catch (error) {
      console.error('Error fetching workspace:', error);
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
    catch (error) {
      console.error('Failed to create workspace:', error);
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
    catch (error) {
      console.error('Failed to create workspace:', error);
    }
  },
};
