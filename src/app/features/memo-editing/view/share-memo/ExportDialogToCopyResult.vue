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
      <div class="flex justify-end gap-2">
        <AppButton
          color="neutral"
          variant="ghost"
          @click="modalOpen = false"
        >
          Close
        </AppButton>
        <AppButton
          @click="$emit('copy', textToExport_)"
        >
          Copy
        </AppButton>
      </div>
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
