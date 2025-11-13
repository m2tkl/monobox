import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { Workspace } from '~/models/workspace';

import { command } from '~/external/tauri/command';

const key = ['workspace', 'current'] as const;

export function readCurrentWorkspaceState(): ComputedRef<ResourceState<Workspace>> {
  return useResourceManager().select<Workspace>(key);
}

export function requireCurrentWorkspaceValue(): ComputedRef<Workspace> {
  return useResourceManager().selectRequired<Workspace>(key);
}

export function readCurrentWorkspaceSnapshot() {
  return useResourceManager().selectSnapshot<Workspace>(key);
}

export async function loadWorkspace(workspaceSlug: string) {
  return loadResource(key, () => command.workspace.get({ slugName: workspaceSlug }));
}
