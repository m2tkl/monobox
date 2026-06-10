<template>
  <AppButton
    type="button"
    variant="ghost"
    color="neutral"
    size="xs"
    :square="!fullWidth"
    :icon="icon"
    :disabled="disabled"
    :class="[
      'shrink-0',
      fullWidth ? 'w-full justify-start px-2' : '',
    ]"
    @mousedown.prevent
    @click="!disabled && $emit('exec')"
  >
    {{ label }}
  </AppButton>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}>();

defineEmits<{ exec: () => void }>();
</script>
