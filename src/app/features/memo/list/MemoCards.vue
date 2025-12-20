<template>
  <ul class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
    <li
      v-for="memo in memos"
      :key="memo.id"
      class="aspect-[1/1] overflow-hidden rounded-lg"
    >
      <NuxtLink :to="`/${route.params.workspace}/${memo.slug_title}`">
        <MemoThumbnail
          :title="truncateString(extractsTitleParts(memo.title).memoTitle, TITLE_TRUNCATE)"
          :context="extractsTitleParts(memo.title).context"
          :description="memo.description"
          :thumbnail-image="memo.thumbnail_image"
        />
      </NuxtLink>
    </li>
  </ul>
</template>

<script setup lang="ts">
import MemoThumbnail from '~/app/features/memo/list/MemoThumbnail.vue';

import type { MemoIndexItem } from '~/models/memo';

defineProps<{
  memos: MemoIndexItem[];
}>();

const TITLE_TRUNCATE = 32;

const route = useRoute();

function extractsTitleParts(title: string): { memoTitle: string; context: string } {
  const parts = title.split('/');
  const memoTitle = parts.pop() ?? title;
  return { memoTitle, context: parts.join('/') };
}
</script>

<style scoped>
/* Completely hide any dividers in the card */
:deep(.divide-y > *) {
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.divide-gray-200 > *) {
  border-top: none !important;
}

:deep([class*="divide-"]) {
  border: none !important;
}
</style>
