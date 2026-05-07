<!-- eslint-disable vue/no-v-html -->
<template>
  <NuxtLayout name="default">
    <template #main>
      <Slide :html="slidesHtml" />
    </template>

    <template #actions>
      <div class="fixed bottom-6 right-6 z-50 flex gap-2">
        <UButton
          :icon="iconKey.arrowLeft"
          color="neutral"
          variant="soft"
          @click="$router.go(-1)"
        >
          Exit
        </UButton>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { JSONContent } from '@tiptap/vue-3';

// Slide styles (Reveal core, theme, highlight theme)
import '~/assets/css/modules/slide.css';

import { convertMemoToHtml } from '~/features/memo-editing';
import Slide from '~/features/slide/Slide.vue';
import { useQuery } from '~/resource-runtime/useQuery';
import { memoDetailQuery } from '~/resources/memo/queries';

definePageMeta({
  path: '/:workspace/:memo/_slide',
});

const route = useRoute();

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');
const { snapshot: memoSnap } = useQuery(memoDetailQuery, {
  workspaceSlug,
  memoSlug,
});

await usePageLoader(async () => {
  await memoDetailQuery.fetch({
    workspaceSlug: workspaceSlug.value,
    memoSlug: memoSlug.value,
  });
});

const memo = computed(() => {
  if (!memoSnap.value.current) {
    throw new Error('Memo is not loaded.');
  }

  return memoSnap.value.current;
});

const slidesHtml = computed(() =>
  convertMemoToHtml(JSON.parse(memo.value.content) as JSONContent, memo.value.title),
);
</script>
