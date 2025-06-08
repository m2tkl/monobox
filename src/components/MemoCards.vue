<template>
  <ul class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
    <li
      v-for="memo in memos"
      :key="memo.id"
      class="aspect-[1/1] overflow-hidden rounded-lg"
    >
      <NuxtLink :to="`/${route.params.workspace}/${memo.slug_title}`">
        <UCard
          class="aspect-[1/1] hover:bg-slate-100"
          :ui="{
            header: 'px-3 pt-3 pb-0 sm:px-3 divide-white',
            body: 'px-3 pb-4 pt-1 sm:p-3 divide-white',
            root: 'divide-white hover:divide-slate-100',
          }"
        >
          <template #header>
            <h3 class="truncate-multiline text-sm font-semibold text-gray-700">
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
            class="truncate-multiline text-sm text-gray-500"
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
