<template>
  <UButton
    v-bind="attrs"
    :label="label"
    :icon="icon"
    :size="size"
    :color="color"
    :variant="variant"
    :loading="loading"
    :disabled="disabled"
    :type="type"
    :square="square"
    :block="block"
  >
    <slot />
  </UButton>
</template>

<script setup lang="ts">
import { toRefs, useAttrs } from 'vue';

const props = withDefaults(defineProps<{
  label?: string;
  icon?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  square?: boolean;
  block?: boolean;
}>(), {
  variant: 'solid',
  color: 'primary',
  type: 'button',
});

const attrs = useAttrs();

const {
  label,
  icon,
  size,
  color,
  variant,
  loading,
  disabled,
  type,
  square,
  block,
} = toRefs(props);
</script>
