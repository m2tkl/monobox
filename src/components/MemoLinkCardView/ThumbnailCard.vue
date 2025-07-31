<template>
  <UCard
    class="aspect-[1/1] card-interactive"
    :ui="{
      header: 'px-3 pt-3 pb-0 sm:px-3',
      body: 'px-3 pb-4 pt-1 sm:p-3',
      root: 'overflow-hidden',
    }"
  >
    <template #header>
      <h3 class="truncate-multiline text-sm font-semibold memo-link-title">
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
      class="truncate-multiline text-sm memo-link-description"
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

/* Force hide all borders and dividers */
:deep(*) {
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.card > *) {
  border: none !important;
}

:deep(.card-header) {
  border-bottom: none !important;
}

:deep(.card-body) {
  border-top: none !important;
}
</style>
