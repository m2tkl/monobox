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
              ref="searchFieldRef"
              v-model="query"
              class="flex-1"
              placeholder="Search in memos"
              type="search"
            />
            <AppButton
              v-if="hasQuery"
              variant="subtle"
              color="neutral"
              size="sm"
              @click="clearQuery"
            >
              Clear
            </AppButton>
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
import { nextTick, onMounted, ref } from 'vue';

import { useSearchPage } from './useSearchPage';

import LoadingSpinner from '~/shared/components/status/LoadingSpinner.vue';
import { iconKey } from '~/utils/icon';

const {
  workspaceSlug,
  query,
  results,
  isLoading,
  hasQuery,
  itemsToShow,
  clearQuery,
  formatDate,
} = useSearchPage();

const searchFieldRef = ref<{ $el?: Element } | null>(null);

onMounted(async () => {
  await nextTick();
  const input = searchFieldRef.value?.$el?.querySelector('input');
  if (input instanceof HTMLInputElement) {
    input.focus();
    input.select();
  }
});
</script>
