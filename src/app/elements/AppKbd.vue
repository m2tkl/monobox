<template>
  <UKbd
    :value="value"
    :size="size"
    :variant="variant"
    :class="kbdClass"
  >
    <slot />
  </UKbd>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  value?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  kbdClass?: string;
}>(), {
  size: 'md',
  variant: 'outline',
});
</script>
