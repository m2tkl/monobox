<template>
  <UButton :icon="icon" variant="ghost" color="gray" square size="2xs" @click="$emit('click')"></UButton>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
}>();

defineEmits<{
  click: () => void
}>()
</script>
