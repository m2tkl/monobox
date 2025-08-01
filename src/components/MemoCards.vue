<template>
  <ul class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
    <li
      v-for="memo in memos"
      :key="memo.id"
      class="aspect-[1/1] overflow-hidden rounded-lg"
    >
      <NuxtLink :to="`/${route.params.workspace}/${memo.slug_title}`">
        <UCard
          class="aspect-[1/1] card-interactive"
          :ui="{
            header: 'px-3 pt-3 pb-0 sm:px-3',
            body: 'px-3 pb-4 pt-1 sm:p-3',
            root: 'overflow-hidden',
          }"
        >
          <template #header>
            <h3 class="truncate-multiline text-sm font-semibold card-title">
              {{ truncateString(memo.title, 32) }}
            </h3>
          </template>
          <img
            v-if="memo.thumbnail_image"
            :src="transformImageSrc(memo.thumbnail_image)"
          >
          <p
            v-for="p in truncateString(memo.description ? memo.description : '', 128)?.split('\n')"
            v-else
            :key="p"
            class="truncate-multiline text-sm card-description"
          >
            {{ p }}
          </p>
        </UCard>
      </NuxtLink>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { MemoIndexItem } from '~/models/memo';

defineProps<{
  memos: MemoIndexItem[];
}>();

const route = useRoute();
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
