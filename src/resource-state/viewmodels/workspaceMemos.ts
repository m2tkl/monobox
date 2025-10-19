import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';
import { readMemoCollectionSnapshot } from '../resources/memoCollection';

import type { MemoIndexItem } from '~/models/memo';

export type WorkspaceMemosViewModel = {
  data: {
    items: MemoIndexItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useWorkspaceMemosViewModel() {
  const memosSnap = readMemoCollectionSnapshot();

  const items = computed<MemoIndexItem[]>(() => memosSnap.value.current ?? []);

  const flags = computed(() => {
    const f = deriveViewModelFlags(memosSnap.value);
    return { ...f };
  });

  const vm = computed<WorkspaceMemosViewModel>(() => ({
    data: { items: items.value },
    flags: {
      isLoading: flags.value.isLoading,
      isStale: flags.value.isStale,
      hasError: flags.value.hasError,
    },
  }));

  return vm;
}
