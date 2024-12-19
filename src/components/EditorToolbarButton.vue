<template>
  <UButton @click="$emit('exec')" variant="ghost" color="gray" size="2xs" square
  :icon="icon"
  >
  {{ label }}
  </UButton>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  label?: string
}>()

defineEmits<{exec: void}>()
</script>
