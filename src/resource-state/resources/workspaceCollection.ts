import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { Workspace } from '~/models/workspace';

import { workspaceCommand } from '~/external/tauri/workspace';

const key = ['workspace', 'collection'] as const;

export function readWorkspaceCollectionState(): ComputedRef<ResourceState<Workspace[]>> {
  return useResourceManager().select<Workspace[]>(key);
}

export function requireWorkspaceCollectionValue(): ComputedRef<Workspace[]> {
  return useResourceManager().selectRequired<Workspace[]>(key);
}

export async function loadWorkspaceCollection() {
  return loadResource(key, () => workspaceCommand.list());
}
