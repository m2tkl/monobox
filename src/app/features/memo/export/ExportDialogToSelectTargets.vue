<template>
  <UModal
    v-model:open="modalOpen"
    title="Export pages as HTML"
    description="Select export targets from related links."
  >
    <template #body>
      <ul>
        <li
          v-for="item in exportTargets"
          :key="item.id"
          class="flex gap-1 items-center"
        >
          <UCheckbox v-model="item.target" />
          <span>
            {{ item.title }}
          </span>
        </li>
      </ul>
    </template>

    <template #footer>
      <UButton
        class="bg-slate-600"
        @click="$emit('select', exportTargets.filter((link) => link.target))"
      >
        Export
      </UButton>
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
watch(modalOpen, (isOpen) => {
  if (isOpen) {
    onDialogOpen();
  }
  else {
    onDialogClose();
  }
});

const onDialogOpen = () => {
  exportTargets.value = props.exportCandidates.map(
    link => ({ ...link, target: true }),
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
