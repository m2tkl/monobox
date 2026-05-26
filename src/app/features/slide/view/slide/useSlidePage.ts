import { computed } from 'vue';

import { loadSlideMemo } from '../../resource/read/loadSlideMemo';
import { useSlideMemoReadModel } from '../../resource/read-model';

import type { JSONContent } from '@tiptap/vue-3';

import { convertMemoToHtml } from '~/app/features/memo-editing';

export function useSlidePage() {
  const { workspaceSlug, memoSlug, memoSnap } = useSlideMemoReadModel();

  const loadInitialData = async () => {
    await loadSlideMemo(workspaceSlug.value, memoSlug.value);
  };

  const memo = computed(() => {
    if (!memoSnap.value.current) {
      throw new Error('Memo is not loaded.');
    }

    return memoSnap.value.current;
  });

  const slidesHtml = computed(() =>
    convertMemoToHtml(JSON.parse(memo.value.content) as JSONContent, memo.value.title),
  );

  return {
    slidesHtml,
    loadInitialData,
  };
}
