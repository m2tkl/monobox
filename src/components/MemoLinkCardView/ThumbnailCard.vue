<template>
  <UCard
    class="aspect-[1/1] hover:bg-slate-100"
    :ui="{
      header: 'px-3 pt-3 pb-0 sm:px-3',
      body: 'px-3 pb-4 pt-1 sm:p-3',
      root: 'divide-white hover:divide-slate-100',
    }"
  >
    <template #header>
      <h3 class="truncate-multiline text-sm font-semibold text-gray-700">
        {{ title }}
      </h3>
    </template>
    <img
      v-if="thumbnailImage"
      :src="transformImageSrc(thumbnailImage)"
    >
    <p
      v-for="p in truncateString(description ? description : '', 128)?.split('\n')"
      v-else
      :key="p"
      class="truncate-multiline text-sm text-gray-500"
    >
      {{ p }}
    </p>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string | undefined | null;
  thumbnailImage: string | undefined | null;
}>();
</script>
