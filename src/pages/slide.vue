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

import Slide from '~/app/features/slide/Slide.vue';
import { convertMemoToHtml } from '~/lib/memo/exporter/toHtml';
import { loadMemo, requireMemoValue } from '~/resource-state/resources/memo';

definePageMeta({
  path: '/:workspace/:memo/_slide',
});

const route = useRoute();

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

await usePageLoader(async () => {
  await loadMemo(workspaceSlug.value, memoSlug.value);
});

const memo = requireMemoValue();

const slidesHtml = computed(() =>
  convertMemoToHtml(JSON.parse(memo.value.content) as JSONContent, memo.value.title),
);
</script>
