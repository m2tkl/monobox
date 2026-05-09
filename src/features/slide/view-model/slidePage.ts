import { computed } from 'vue';

import type { JSONContent } from '@tiptap/vue-3';

import { convertMemoToHtml } from '~/features/memo-editing';
import { useQuery } from '~/resource-runtime/useQuery';
import { memoDetailQuery } from '~/resources/memo/queries';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export function useSlidePage() {
  const route = useRoute();

  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

  const { snapshot: memoSnap } = useQuery(memoDetailQuery, {
    workspaceSlug,
    memoSlug,
  });

  const loadInitialData = async () => {
    await memoDetailQuery.fetch({
      workspaceSlug: workspaceSlug.value,
      memoSlug: memoSlug.value,
    });
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
