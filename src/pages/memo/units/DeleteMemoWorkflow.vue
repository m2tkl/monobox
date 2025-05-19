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
              @click="executeHandler?.()"
            >
              Delete
            </UButton>

            <span class="flex-1" />

            <UButton
              variant="solid"
              color="neutral"
              @click="cancelHandler?.()"
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
const currentAction = ref<(() => Promise<void>) | null>(null);

type WorkflowResult =
  | { status: 'success' }
  | { status: 'cancel' }
  | { status: 'error'; error: unknown };

async function runWorkflow({
  confirm,
  deleteFn,
}: {
  confirm: () => Promise<boolean>;
  deleteFn: () => Promise<void>;
}): Promise<WorkflowResult> {
  const ok = await confirm();
  if (!ok) return { status: 'cancel' };

  try {
    await deleteFn();
    return { status: 'success' };
  }
  catch (err) {
    return { status: 'error', error: err };
  }
}

// Intent of mode
type ModeExitStatus = 'completed' | 'cancelled';

const executeHandler = ref<(() => void) | null>(null);
const cancelHandler = ref<(() => void) | null>(null);

const run = (action: () => Promise<void>): Promise<ModeExitStatus> => {
  inProgress.value = true;
  error.value = '';
  currentAction.value = action;

  return new Promise((resolveWorkflowCompletion) => {
    runWorkflow({
      confirm: async () => {
        return new Promise((resolveConfirm) => {
          executeHandler.value = () => {
            resolveConfirm(true);
          };

          cancelHandler.value = () => {
            inProgress.value = false;
            resolveConfirm(false);
          };
        });
      },
      deleteFn: async () => {
        if (!currentAction.value) return;
        await currentAction.value();
      },
    }).then((result) => {
      switch (result.status) {
        case 'success':
          inProgress.value = false;
          resolveWorkflowCompletion('completed');
          break;
        case 'cancel':
          inProgress.value = false;
          resolveWorkflowCompletion('cancelled');
          break;
        case 'error':
          error.value = 'Failed to execute.';
          // Modal remains open.
          break;
      }
    });
  });
};

defineExpose({ run });
</script>
