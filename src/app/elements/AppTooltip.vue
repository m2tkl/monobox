<template>
  <UTooltip :text="text">
    <slot />
  </UTooltip>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>
