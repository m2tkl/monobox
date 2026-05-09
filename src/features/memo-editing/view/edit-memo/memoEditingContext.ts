import { computed, ref, watch } from 'vue';

import { useCurrentMemoReadModel } from '../../resource/read-model';

import { useRoute } from '#imports';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export function useMemoEditingContext() {
  const route = useRoute();

  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');
  const routeHash = computed(() => route.hash);

  const memoReadModel = useCurrentMemoReadModel();

  const memo = computed(() => memoReadModel.value.data.memo);
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
    route,
    workspaceSlug,
    memoSlug,
    routeHash,
    memoReadModel,
    memo,
    memoTitle,
  };
}
