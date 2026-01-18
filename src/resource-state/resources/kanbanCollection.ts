import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { Kanban } from '~/models/kanban';

import { command } from '~/external/tauri/command';

const key = ['workspace', 'current', 'kanban'] as const;

export function readKanbanCollectionState(): ComputedRef<ResourceState<Kanban[]>> {
  return useResourceManager().select<Kanban[]>(key);
}

export function readKanbanCollectionSnapshot() {
  return useResourceManager().selectSnapshot<Kanban[]>(key);
}

export async function loadKanbans(workspaceSlug: string) {
  return loadResource(key, () => command.kanban.list({ slugName: workspaceSlug }));
}
