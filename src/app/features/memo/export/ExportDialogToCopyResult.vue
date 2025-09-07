<template>
  <UModal
    v-model:open="modalOpen"
    title="Export result"
  >
    <template #body>
      <UTextarea
        v-model="textToExport_"
        class="w-full h-64"
        :rows="12"
      />
    </template>

    <template #footer>
      <UButton
        class="bg-slate-600"
        @click="$emit('copy', textToExport_)"
      >
        Copy
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  textToExport: string;
}>();

defineEmits<{
  (e: 'copy', textToCopy: string): void;
}>();

/* --- State --- */
/**
 * Dialog open/close state
 */
const modalOpen = defineModel<boolean>('open');

/**
 * Export text
 */
const textToExport_ = ref('');

/* --- Setup / Cleanup --- */
watch(modalOpen, (opened) => {
  if (opened) {
    onDialogOpen();
  }
  else {
    onDialogClose();
  }
});

const onDialogOpen = () => {
  textToExport_.value = props.textToExport;
};

const onDialogClose = () => {
  resetState();
};

/* --- Helper --- */
const resetState = () => {
  textToExport_.value = '';
};
</script>
