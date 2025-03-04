<template>
  <UButton
    :icon="icon"
    variant="ghost"
    color="gray"
    square
    size="2xs"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
}>();
</script>
