import { loadResource } from '../infra/loadResource';
import { useResourceManager } from '../infra/useResourceManager';

import type { ResourceState } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { MemoDetail } from '~/models/memo';

import { memoCommand } from '~/external/tauri/memo';

const key = ['memo'] as const;

export function readMemoState(): ComputedRef<ResourceState<MemoDetail>> {
  return useResourceManager().select<MemoDetail>(key);
}

export function requireMemoValue(): ComputedRef<MemoDetail> {
  return useResourceManager().selectRequired<MemoDetail>(key);
}

export function readMemoSnapshot() {
  return useResourceManager().selectSnapshot<MemoDetail>(key);
}

export async function loadMemo(workspaceSlug: string, memoSlug: string) {
  return loadResource(key, () =>
    memoCommand.get({ workspaceSlugName: workspaceSlug, memoSlugTitle: memoSlug }),
  );
}
