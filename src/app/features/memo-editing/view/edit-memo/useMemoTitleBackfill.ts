import { ref, watch } from 'vue';

import type { ComputedRef } from 'vue';
import type { MemoDetail } from '~/models/memo';

// Fill the editable title only while it is still empty.
export function useMemoTitleBackfill(memo: ComputedRef<MemoDetail | null>) {
  const memoTitle = ref('');

  watch(memo, (currentMemo) => {
    if (!currentMemo) {
      return;
    }

    if (memoTitle.value === '') {
      memoTitle.value = currentMemo.title;
    }
  }, { immediate: true });

  return {
    memoTitle,
  };
}
