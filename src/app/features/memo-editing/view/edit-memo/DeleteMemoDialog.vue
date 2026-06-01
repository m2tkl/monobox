<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCard>
        <div class="h-24">
          Once you delete a memo, there is no going back. Please be certain.
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <AppButton
              color="neutral"
              variant="ghost"
              @click="resolveConfirmation(false)"
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              color="error"
              @click="resolveConfirmation(true)"
            >
              Delete
            </AppButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = ref(false);
const resolvePendingConfirmation = ref<((confirmed: boolean) => void) | null>(null);

function resolveConfirmation(confirmed: boolean) {
  const resolve = resolvePendingConfirmation.value;
  resolvePendingConfirmation.value = null;
  isOpen.value = false;
  resolve?.(confirmed);
}

async function confirm() {
  isOpen.value = true;
  return new Promise<boolean>((resolve) => {
    resolvePendingConfirmation.value = resolve;
  });
}

watch(isOpen, (open) => {
  if (!open && resolvePendingConfirmation.value) {
    resolveConfirmation(false);
  }
});

defineExpose({
  confirm,
});
</script>
