import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { Workspace } from '~/models/workspace';

import { workspaceCommand } from '~/external/tauri/workspace';

const key = ['workspace', 'current'] as const;

export function readCurrentWorkspaceState(): ComputedRef<ResourceState<Workspace>> {
  return useResourceManager().select<Workspace>(key);
}

export function requireCurrentWorkspaceValue(): ComputedRef<Workspace> {
  return useResourceManager().selectRequired<Workspace>(key);
}

export async function loadWorkspace(workspaceSlug: string) {
  return loadResource(key, () => workspaceCommand.get({ slugName: workspaceSlug }));
}
