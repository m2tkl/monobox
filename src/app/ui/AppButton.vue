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
  color?: 'neutral' | 'primary' | 'error' | 'success' | 'warning';
  variant?: 'solid' | 'outline' | 'ghost' | 'subtle' | 'link';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  square?: boolean;
}>(), {
  variant: 'subtle',
  color: 'neutral',
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
} = toRefs(props);
</script>
