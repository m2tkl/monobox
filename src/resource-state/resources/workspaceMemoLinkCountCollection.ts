import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { MemoLinkCount } from '~/models/link';

import { command } from '~/external/tauri/command';

const key = ['workspace', 'current', 'memo-link-counts'] as const;

export function readWorkspaceMemoLinkCountCollectionState(): ComputedRef<ResourceState<MemoLinkCount[]>> {
  return useResourceManager().select<MemoLinkCount[]>(key);
}

export function requireWorkspaceMemoLinkCountCollectionValue(): ComputedRef<MemoLinkCount[]> {
  return useResourceManager().selectRequired<MemoLinkCount[]>(key);
}

export function readWorkspaceMemoLinkCountCollectionSnapshot() {
  return useResourceManager().selectSnapshot<MemoLinkCount[]>(key);
}

export async function loadWorkspaceMemoLinkCounts(workspaceSlug: string) {
  return loadResource(key, () => command.link.listCounts(workspaceSlug));
}
