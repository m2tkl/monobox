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
import { onMounted, ref, computed } from 'vue';

import type { JSONContent } from '@tiptap/vue-3';

// Slide styles (Reveal core, theme, highlight theme)
import '~/assets/css/modules/slide.css';

import Slide from '~/app/features/slide/ui/Slide.vue';
import { convertMemoToHtml } from '~/lib/memo/exporter/toHtml';

definePageMeta({
  path: '/:workspace/:memo/_slide',
});

const route = useRoute();
const workspaceSlug = computed(() => route.params.workspace as string);
const memoSlug = computed(() => route.params.memo as string);

const { ready, error } = loadMemoData(workspaceSlug.value, memoSlug.value);

if (error.value) {
  showError({ statusCode: 404, statusMessage: 'Page not found', message: `Memo ${memoSlug.value} not found.` });
}

const slidesHtml = ref('');

onMounted(async () => {
  const { memo } = await ready;
  slidesHtml.value = convertMemoToHtml(JSON.parse(memo.content) as JSONContent, memo.title);
});
</script>
