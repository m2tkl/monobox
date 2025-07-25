<template>
  <UCard
    class="flex aspect-[1/1] items-center justify-center"
    :class="{ 'bg-blue-200 hover:bg-blue-300': cardType === 'link' }"
    :ui="{
      header: 'px-3 pt-3 pb-0 sm:px-3',
      body: 'px-3 pb-4 pt-1 sm:p-3',
      root: 'divide-white',
    }"
  >
    <h3 class="truncate-multiline flex flex-col items-center gap-1 text-sm font-semibold text-gray-700">
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
