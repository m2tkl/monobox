<template>
  <UPopover
    v-model:open="open"
    :ui="{
      content: 'overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] ring-[var(--color-border-light)]',
    }"
    :content="{
      align,
      side,
      sideOffset,
      onOpenAutoFocus: preventOpenAutoFocus ? preventAutoFocus : undefined,
    }"
  >
    <slot />

    <template #content>
      <slot name="content" />
    </template>
  </UPopover>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  preventOpenAutoFocus?: boolean;
}>(), {
  align: 'end',
  side: 'bottom',
  sideOffset: 8,
  preventOpenAutoFocus: false,
});

const open = defineModel<boolean>('open', { default: false });
const preventAutoFocus = (event: Event) => event.preventDefault();
</script>
