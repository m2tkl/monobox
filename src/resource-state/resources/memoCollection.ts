import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { MemoIndexItem } from '~/models/memo';

import { command } from '~/external/tauri/command';

const key = ['workspace', 'current', 'memos'] as const;

export function readMemoCollectionState(): ComputedRef<ResourceState<MemoIndexItem[]>> {
  return useResourceManager().select<MemoIndexItem[]>(key);
}

export function requireMemoCollectionValue(): ComputedRef<MemoIndexItem[]> {
  return useResourceManager().selectRequired<MemoIndexItem[]>(key);
}

export function readMemoCollectionSnapshot() {
  return useResourceManager().selectSnapshot<MemoIndexItem[]>(key);
}

export async function loadWorkspaceMemos(workspaceSlug: string) {
  return loadResource(key, () => command.memo.list({ slugName: workspaceSlug }));
}
