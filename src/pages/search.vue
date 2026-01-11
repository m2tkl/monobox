<template>
  <NuxtLayout>
    <template #main>
      <div class="size-full overflow-y-auto px-5 pb-6">
        <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 pt-6">
          <div class="flex items-center gap-3">
            <UIcon
              :name="iconKey.search"
              class="text-xl"
            />
            <UInput
              v-model="query"
              class="flex-1"
              placeholder="Search in memos"
            />
            <UButton
              v-if="hasQuery"
              variant="subtle"
              color="neutral"
              size="sm"
              @click="clearQuery"
            >
              Clear
            </UButton>
          </div>

          <LoadingSpinner v-if="isLoading" />

          <template v-else>
            <div
              v-if="hasQuery && results.length === 0"
              class="text-sm text-slate-500"
            >
              No results found.
            </div>

            <div v-else>
              <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {{ hasQuery ? 'Results' : 'Recent' }}
              </h2>

              <div class="mt-3 flex flex-col gap-2">
                <NuxtLink
                  v-for="item in itemsToShow"
                  :key="item.slug_title"
                  :to="`/${workspaceSlug}/${item.slug_title}`"
                  class="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
                >
                  <div class="flex items-center justify-between gap-4">
                    <span class="font-semibold text-slate-900">{{ item.title }}</span>
                    <span class="text-xs text-slate-400">{{ formatDate(item.modified_at) }}</span>
                  </div>
                  <div
                    v-if="item.description"
                    class="line-clamp-2 text-sm text-slate-600"
                  >
                    {{ item.description }}
                  </div>
                </NuxtLink>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { MemoIndexItem, MemoSearchItem } from '~/models/memo';

import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import { command } from '~/external/tauri/command';
import { useWorkspaceMemosViewModel } from '~/resource-state/viewmodels/workspaceMemos';
import { iconKey } from '~/utils/icon';
import { useConsoleLogger } from '~/utils/logger';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

definePageMeta({
  path: '/:workspace/_search',
  layout: 'search',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});

const route = useRoute();
const logger = useConsoleLogger('pages/search');

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');

const memosVM = useWorkspaceMemosViewModel();
const recentMemos = computed<MemoIndexItem[]>(() => {
  return memosVM.value.data.items
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
      const response = await command.memo.search({
        workspaceSlugName: slug,
        query: trimmed,
        limit: 50,
        offset: 0,
      });

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
</script>
