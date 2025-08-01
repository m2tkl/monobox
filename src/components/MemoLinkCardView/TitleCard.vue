<template>
  <UCard
    class="flex aspect-[1/1] items-center justify-center"
    :class="{
      'memo-link-forward-interactive': cardType === 'link',
      'memo-link-text-card': cardType === 'text',
    }"
    :ui="{
      header: 'px-3 pt-3 pb-0 sm:px-3',
      body: 'px-3 pb-4 pt-1 sm:p-3',
      root: 'overflow-hidden',
    }"
  >
    <h3 class="truncate-multiline flex flex-col items-center gap-1 text-sm font-semibold memo-link-title">
      {{ title }}
      <Icon
        :name="iconKey.link"
        class="text-lg"
      />
    </h3>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{ title: string; cardType: 'text' | 'link' }>();
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
