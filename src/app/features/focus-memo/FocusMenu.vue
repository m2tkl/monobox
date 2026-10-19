<template>
  <AppPopover
    v-model:open="isOpen"
    prevent-open-auto-focus
  >
    <AppButton
      class="focus-menu-trigger rounded-full"
      :icon="activeItems.length === 0 ? iconKey.success : iconKey.task"
      color="neutral"
      variant="outline"
      size="xs"
      :aria-label="activeItems.length === 0 ? 'Focus: complete' : `Focus: ${activeItems.length} remaining`"
    >
      <span
        v-if="activeItems.length > 0"
        class="focus-menu-count"
      >{{ activeItems.length }}</span>
    </AppButton>

    <template #content>
      <FocusSidebar
        :is-open="true"
        floating
        @close="isOpen = false"
      />
    </template>
  </AppPopover>
</template>

<script setup lang="ts">
import FocusSidebar from './FocusSidebar.vue';
import { useFocusListReadModel } from './resource/read-model';

import AppPopover from '~/app/elements/overlays/AppPopover.vue';
import { iconKey } from '~/utils/icon';

const isOpen = ref(false);
const focusListVM = useFocusListReadModel();
const activeItems = computed(() => focusListVM.value.data.activeItems);
</script>

<style scoped>
.focus-menu-trigger {
  min-width: 1.75rem;
  justify-content: center;
}

.focus-menu-count {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1;
}
</style>
