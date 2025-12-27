import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { Bookmark } from '~/models/bookmark';

import { command } from '~/external/tauri/command';

const key = ['bookmark', 'collection'] as const;

export function readBookmarkCollectionState(): ComputedRef<ResourceState<Bookmark[]>> {
  return useResourceManager().select<Bookmark[]>(key);
}

export function readBookmarkCollectionSnapshot() {
  return useResourceManager().selectSnapshot<Bookmark[]>(key);
}

export function requireBookmarkCollectionValue(): ComputedRef<Bookmark[]> {
  return useResourceManager().selectRequired<Bookmark[]>(key);
}

export async function loadBookmarkCollection(workspaceSlug: string) {
  return loadResource(key, () => command.bookmark.list(workspaceSlug));
}
