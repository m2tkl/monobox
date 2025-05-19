<template>
  <UModal v-model:open="inProgress">
    <template #content>
      <UCard>
        <div class="space-y-2">
          <p v-if="error">
            <UAlert
              :title="error"
              color="error"
              variant="subtle"
            />
          </p>

          <p class="h-24">
            Once you delete a memo, there is no going back. Please be certain.
          </p>
        </div>

        <template #footer>
          <div class="flex h-8 w-full">
            <UButton
              type="submit"
              color="error"
              @click="execute"
            >
              Delete
            </UButton>

            <span class="flex-1" />

            <UButton
              variant="solid"
              color="neutral"
              @click="cancel"
            >
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const inProgress = ref(false);
const error = ref('');
let resolve: ((ok: boolean) => void) | null = null;

const currentAction = ref<(() => Promise<void>) | null>(null);

const startWorkflow = (action: () => Promise<void>): Promise<boolean> => {
  inProgress.value = true;
  error.value = '';
  currentAction.value = action;

  return new Promise((r) => {
    resolve = r;
  });
};

const execute = async () => {
  try {
    if (!currentAction.value) return;

    await currentAction.value();
    inProgress.value = false;
    resolve?.(true);
  }
  catch {
    error.value = 'Failed to execute.';
  }
};

const cancel = () => {
  inProgress.value = false;
  resolve?.(false);
};

defineExpose({ startWorkflow });
</script>
