import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { searchMemos } from '../../resource/read/searchMemos';

import type { MemoIndexItem, MemoSearchItem } from '~/models/memo';

import { useWorkspaceMemosReadModel } from '~/app/features/memo-browsing';
import { useConsoleLogger } from '~/utils/logger';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const searchResultCache = new Map<string, MemoSearchItem[]>();

export function useSearchPage() {
  const route = useRoute();
  const router = useRouter();
  const logger = useConsoleLogger('features/search/SearchPage');

  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const routeQuery = computed(() => {
    const value = route.query.q;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value[0] || '';
    return '';
  });

  const memosReadModel = useWorkspaceMemosReadModel();
  const recentMemos = computed<MemoIndexItem[]>(() => {
    return memosReadModel.value.data.items
      .toSorted((a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime())
      .slice(0, 30);
  });

  const query = ref(routeQuery.value);
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

  watch(routeQuery, (nextQuery) => {
    if (query.value !== nextQuery) {
      query.value = nextQuery;
    }
  });

  watch(query, async (nextQuery) => {
    if (nextQuery === routeQuery.value) return;

    const nextRouteQuery = { ...route.query };
    if (nextQuery) {
      nextRouteQuery.q = nextQuery;
    }
    else {
      delete nextRouteQuery.q;
    }

    await router.replace({
      path: route.path,
      query: nextRouteQuery,
      hash: route.hash,
    });
  });

  watch([query, workspaceSlug], ([term, slug]) => {
    if (!slug) {
      results.value = [];
      isLoading.value = false;
      return;
    }

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

    const cacheKey = `${slug}:${trimmed}`;
    const cachedResults = searchResultCache.get(cacheKey);
    if (cachedResults) {
      results.value = cachedResults;
      isLoading.value = false;
      return;
    }

    const requestId = ++searchRequestId;
    isLoading.value = true;
    searchTimerId = window.setTimeout(async () => {
      try {
        const response = await searchMemos(slug, trimmed);
        const normalizedResults = response.map(result => ({
          ...result,
          description: result.snippet || result.description || '',
        }));

        if (requestId === searchRequestId) {
          results.value = normalizedResults;
          searchResultCache.set(cacheKey, normalizedResults);
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
  }, { immediate: true });

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
