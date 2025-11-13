import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { Workspace } from '~/models/workspace';

import { command } from '~/external/tauri/command';

const key = ['workspace', 'collection'] as const;

export function readWorkspaceCollectionState(): ComputedRef<ResourceState<Workspace[]>> {
  return useResourceManager().select<Workspace[]>(key);
}

export function requireWorkspaceCollectionValue(): ComputedRef<Workspace[]> {
  return useResourceManager().selectRequired<Workspace[]>(key);
}

export function readWorkspaceCollectionSnapshot() {
  return useResourceManager().selectSnapshot<Workspace[]>(key);
}

export async function loadWorkspaceCollection() {
  return loadResource(key, () => command.workspace.list());
}
