<template>
  <UInput
    v-model="model"
    class="w-full"
    v-bind="attrs"
    :type="type"
    :placeholder="placeholder"
    :size="size"
    :color="color"
    :variant="variant"
    :disabled="disabled"
    :required="required"
    :autocomplete="autocomplete"
    :autofocus="autofocus"
    :autofocus-delay="autofocusDelay"
    :ui="appInputUi"
  />
</template>

<script setup lang="ts">
import { useAttrs } from 'vue';

const model = defineModel<string | number | null>();

withDefaults(defineProps<{
  type?: string;
  placeholder?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
  variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none';
  disabled?: boolean;
  required?: boolean;
  autocomplete?: string;
  autofocus?: boolean;
  autofocusDelay?: number;
}>(), {
  type: 'text',
  size: 'md',
  color: 'primary',
  variant: 'none',
  autocomplete: 'off',
  autofocusDelay: 0,
});

const attrs = useAttrs();
const appInputUi = {
  root: 'w-full',
  base: 'w-full rounded-[calc(var(--ui-radius)*1.5)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-text-muted)_18%,transparent)] transition-colors focus:outline-none hover:border-[var(--color-border-hover)] focus-visible:border-[var(--color-primary)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-75',
  leading: 'absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none',
  trailing: 'absolute inset-y-0 end-0 flex items-center pe-2.5 pointer-events-none',
  leadingIcon: 'shrink-0 text-[var(--color-text-secondary)]',
  trailingIcon: 'shrink-0 text-[var(--color-text-secondary)]',
};
</script>
