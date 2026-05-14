import { computed, onBeforeUnmount, ref, watch } from 'vue';

import type { MemoIndexItem, MemoSearchItem } from '~/models/memo';

import { searchMemos } from '../../resource/read/searchMemos';
import { useWorkspaceMemosReadModel } from '~/features/memo-browsing';
import { useConsoleLogger } from '~/utils/logger';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export function useSearchPage() {
  const route = useRoute();
  const logger = useConsoleLogger('features/search/SearchPage');

  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');

  const memosReadModel = useWorkspaceMemosReadModel();
  const recentMemos = computed<MemoIndexItem[]>(() => {
    return memosReadModel.value.data.items
      .toSorted((a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime())
      .slice(0, 30);
  });

  const query = ref('');
  const results = ref<MemoSearchItem[]>([]);
  const isLoading = ref(false);
  const hasQuery = computed(() => query.value.trim().length > 0);

  const searchDebounceMs = 400;
  let searchTimerId: number | undefined;
  let searchRequestId = 0;

  const itemsToShow = computed(() => {
    if (hasQuery.value) return results.value;

    return recentMemos.value.map(memo => ({
      ...memo,
      description: memo.description ?? '',
    }));
  });

  const clearQuery = () => {
    query.value = '';
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  watch([query, workspaceSlug], ([term, slug]) => {
    if (!slug) return;

    if (searchTimerId) {
      window.clearTimeout(searchTimerId);
      searchTimerId = undefined;
    }

    const trimmed = term.trim();
    if (!trimmed) {
      results.value = [];
      isLoading.value = false;
      return;
    }

    const requestId = ++searchRequestId;
    isLoading.value = true;
    searchTimerId = window.setTimeout(async () => {
      try {
        const response = await searchMemos(slug, trimmed);

        if (requestId === searchRequestId) {
          results.value = response.map(result => ({
            ...result,
            description: result.snippet || result.description || '',
          }));
        }
      }
      catch (error) {
        logger.warn('Search failed', error);
      }
      finally {
        if (requestId === searchRequestId) {
          isLoading.value = false;
        }
      }
    }, searchDebounceMs);
  });

  onBeforeUnmount(() => {
    if (searchTimerId) window.clearTimeout(searchTimerId);
  });

  return {
    workspaceSlug,
    query,
    results,
    isLoading,
    hasQuery,
    itemsToShow,
    clearQuery,
    formatDate,
  };
}
