import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { Link } from '~/models/link';

import { command } from '~/external/tauri/command';

const key = ['link', 'collection'] as const;

export function readMemoLinkCollectionState(): ComputedRef<ResourceState<Link[]>> {
  return useResourceManager().select<Link[]>(key);
}

export function requireMemoLinkCollectionValue(): ComputedRef<Link[]> {
  return useResourceManager().selectRequired<Link[]>(key);
}

export function readMemoLinkCollectionSnapshot() {
  return useResourceManager().selectSnapshot<Link[]>(key);
}

export async function loadMemoLinkCollection(workspaceSlug: string, memoSlug: string) {
  return loadResource(key, () => command.link.list({ workspaceSlug, memoSlug }));
}
