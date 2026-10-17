<template>
  <div
    class="search-categories"
    role="tablist"
    aria-label="Search category"
  >
    <button
      v-for="(item, index) in items"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.value"
      :tabindex="modelValue === item.value ? 0 : -1"
      :class="{ 'is-selected': modelValue === item.value }"
      @click="emit('update:modelValue', item.value)"
      @keydown="onKeydown($event, index)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  items: { value: string; label: string }[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

function onKeydown(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  const length = props.items.length;
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + length) % length;
  const item = props.items[nextIndex];
  if (!item) return;
  emit('update:modelValue', item.value);
  const target = event.currentTarget as HTMLElement;
  (target.parentElement?.children[nextIndex] as HTMLElement | undefined)?.focus();
}
</script>

<style scoped>
.search-categories {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}
.search-categories button {
  flex: 1;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  color: var(--color-text-muted);
}
.search-categories button:hover {
  background: var(--color-surface-hover);
}
.search-categories button.is-selected {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  font-weight: 600;
}
.search-categories button:focus-visible {
  outline: 2px solid var(--color-border-light);
  outline-offset: 2px;
}
</style>
