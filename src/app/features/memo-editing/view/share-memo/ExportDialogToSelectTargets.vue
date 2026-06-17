<template>
  <UModal
    v-model:open="modalOpen"
    title="Export pages as HTML"
    description="Select export targets from related links."
  >
    <template #body>
      <p
        v-if="exportTargets.length === 0"
        class="text-sm"
        style="color: var(--color-text-secondary)"
      >
        Current page will be exported. No linked pages available.
      </p>
      <ul v-else>
        <li
          v-for="item in exportTargets"
          :key="item.id"
          class="flex gap-1 items-center"
        >
          <AppCheckbox v-model="item.target" />
          <span>
            {{ item.title }}
          </span>
        </li>
      </ul>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton
          color="neutral"
          variant="ghost"
          @click="modalOpen = false"
        >
          Cancel
        </AppButton>
        <AppButton
          @click="$emit('select', exportTargets.filter(link => link.target))"
        >
          Download
        </AppButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Link } from '~/models/link';

type TargetPage = Link & { target: boolean };

const props = defineProps<{
  exportCandidates: Link[];
}>();

defineEmits<{
  (e: 'select', targets: Link[]): void;
}>();

/* --- State --- */
/**
 * Dialog open/close state
 */
const modalOpen = defineModel<boolean>('open');

/**
 * Export targets
 */
const exportTargets = ref<TargetPage[]>([]);

/* --- Setup / Cleanup --- */
watch([
  modalOpen,
  () => props.exportCandidates,
], ([isOpen]) => {
  if (isOpen) {
    syncExportTargets();
  }
  else {
    onDialogClose();
  }
}, { deep: true });

const syncExportTargets = () => {
  const selectedIds = new Set(
    exportTargets.value
      .filter(link => link.target)
      .map(link => link.id),
  );
  const hasExistingSelection = exportTargets.value.length > 0;

  exportTargets.value = props.exportCandidates.map(
    link => ({ ...link, target: hasExistingSelection ? selectedIds.has(link.id) : true }),
  );
};

const onDialogClose = () => {
  resetState();
};

/* --- Helper --- */
const resetState = () => {
  exportTargets.value = [];
};
</script>
