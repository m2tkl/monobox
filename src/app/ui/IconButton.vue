<template>
  <UButton
    :icon="icon"
    variant="ghost"
    color="neutral"
    square
    size="xs"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
}>();
</script>
