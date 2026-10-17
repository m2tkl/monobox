<template>
  <UButtonGroup
    v-bind="$attrs"
    :orientation="orientation"
    :size="size"
  >
    <slot />
  </UButtonGroup>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}>(), {
  orientation: 'horizontal',
  size: 'md',
});
</script>
