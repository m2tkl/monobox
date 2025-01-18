<template>
  <UButton
    variant="ghost"
    color="gray"
    size="2xs"
    square
    :icon="icon"
    @click="$emit('exec')"
  >
    {{ label }}
  </UButton>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  label?: string;
}>();

defineEmits<{ exec: () => void }>();
</script>
