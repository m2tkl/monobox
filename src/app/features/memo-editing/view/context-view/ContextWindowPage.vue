<template>
  <main
    ref="scrollContainer"
    class="context-window-page"
  >
    <div
      v-if="isLoading"
      class="context-window-page__state"
    >
      Loading...
    </div>
    <div
      v-else-if="hasError"
      class="context-window-page__state"
    >
      Failed to load memo.
    </div>
    <article
      v-else-if="memo"
      class="context-window-page__memo"
    >
      <h1 class="context-window-page__title">
        {{ memo.title }}
      </h1>
      <div
        class="tiptap context-window-page__content"
        v-html="memoHtml"
      />
    </article>
  </main>
</template>

<script setup lang="ts">
import type { JSONContent } from '@tiptap/vue-3';

import { convertEditorJsonToHtml } from '~/app/features/editor';
import { decodeHeadingHash } from '~/app/features/memo-editing/view/navigate-memo/headingLink';
import { useQuery } from '~/resource-runtime/useQuery';
import { memoDetailQuery } from '~/resources/memo/queries';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const route = useRoute();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');
const { snapshot } = useQuery(memoDetailQuery, {
  workspaceSlug,
  memoSlug,
});

const memo = computed(() => snapshot.value.current);
const isLoading = computed(() => snapshot.value.status === 'loading');
const hasError = computed(() => snapshot.value.status === 'error');

const memoHtml = computed(() => {
  if (!memo.value) {
    return '';
  }

  try {
    return convertEditorJsonToHtml(JSON.parse(memo.value.content) as JSONContent);
  }
  catch {
    return '';
  }
});

const scrollContainer = ref<HTMLElement | null>(null);

const scrollToTargetHash = async () => {
  if (!route.hash) {
    return;
  }

  await nextTick();

  const targetId = decodeHeadingHash(route.hash);
  const target = scrollContainer.value?.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
  target?.scrollIntoView({ block: 'start' });
};

watch(() => [memo.value?.id, route.hash, memoHtml.value] as const, () => {
  void scrollToTargetHash();
}, { immediate: true });
</script>

<style scoped>
.context-window-page {
  height: 100%;
  overflow: auto;
  background-color: var(--color-surface-elevated);
}

.context-window-page__memo {
  max-width: 820px;
  margin: 0 auto;
  padding: 2rem 2rem 8rem;
}

.context-window-page__title {
  margin: 0 0 1.5rem;
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.context-window-page__content {
  color: var(--color-text-primary);
}

.context-window-page__content :deep([id]) {
  scroll-margin-top: 72px;
}

.context-window-page__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  color: var(--color-text-secondary);
}
</style>
