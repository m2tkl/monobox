<template>
  <AppButton
    class="new-tab-search-launcher justify-start text-left"
    :icon="iconKey.search"
    color="neutral"
    variant="outline"
    size="xl"
    block
    aria-label="Search or create a memo"
    @click="emit('open', '')"
    @keydown="onKeydown"
  >
    <span class="new-tab-search-launcher__label">Search or create a memo</span>
  </AppButton>
</template>

<script setup lang="ts">
import AppButton from '~/app/elements/AppButton.vue';
import { iconKey } from '~/utils/icon';

const emit = defineEmits<{
  open: [initialTerm: string];
}>();

function onKeydown(event: KeyboardEvent) {
  if (
    event.key.length !== 1
    || event.key === ' '
    || event.ctrlKey
    || event.metaKey
    || event.altKey
    || event.isComposing
    || event.keyCode === 229
  ) return;

  event.preventDefault();
  emit('open', event.key);
}
</script>

<style scoped>
.new-tab-search-launcher {
  min-height: 3.25rem;
  border-radius: 9999px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.06);
}

.new-tab-search-launcher__label {
  color: var(--color-text-muted);
  font-weight: 400;
}
</style>
