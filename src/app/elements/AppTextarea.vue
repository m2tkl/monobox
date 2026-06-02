<template>
  <UTextarea
    v-model="model"
    class="w-full"
    v-bind="attrs"
    :placeholder="placeholder"
    :rows="rows"
    :size="size"
    :color="color"
    :variant="variant"
    :disabled="disabled"
    :required="required"
    :ui="mergedTextareaUi"
  />
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

const model = defineModel<string | null>();

const props = withDefaults(defineProps<{
  placeholder?: string;
  rows?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
  variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none';
  disabled?: boolean;
  required?: boolean;
  ui?: Record<string, string>;
}>(), {
  rows: 3,
  size: 'md',
  color: 'primary',
  variant: 'none',
});

const attrs = useAttrs();
const appTextareaUi = {
  root: 'w-full',
  base: 'w-full rounded-[calc(var(--ui-radius)*1.5)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-text-muted)_18%,transparent)] transition-colors focus:outline-none hover:border-[var(--color-border-hover)] focus-visible:border-[var(--color-primary)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-75',
};

const mergedTextareaUi = computed(() => ({
  ...appTextareaUi,
  ...(props.ui ?? {}),
}));
</script>
