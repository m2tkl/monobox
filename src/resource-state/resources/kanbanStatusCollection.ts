import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { KanbanStatus } from '~/models/kanbanStatus';

import { command } from '~/external/tauri/command';

const key = (kanbanId: number) => ['workspace', 'current', 'kanbanStatus', kanbanId] as const;

export function readKanbanStatusCollectionState(kanbanId: number): ComputedRef<ResourceState<KanbanStatus[]>> {
  return useResourceManager().select<KanbanStatus[]>(key(kanbanId));
}

export function readKanbanStatusCollectionSnapshot(kanbanId: number) {
  return useResourceManager().selectSnapshot<KanbanStatus[]>(key(kanbanId));
}

export function requireKanbanStatusCollectionValue(kanbanId: number): ComputedRef<KanbanStatus[]> {
  return useResourceManager().selectRequired<KanbanStatus[]>(key(kanbanId));
}

export async function loadKanbanStatuses(workspaceSlug: string, kanbanId: number) {
  return loadResource(key(kanbanId), () => command.kanbanStatus.list({ slugName: workspaceSlug, kanbanId }));
}
