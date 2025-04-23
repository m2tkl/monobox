<template>
  <UModal v-model:open="modalOpen">
    <template #content>
      <UCard>
        <div class="h-24">
          <UForm
            id="set-link"
            :state="state"
            class="space-y-4"
            @submit="$emit('update', state.url)"
          >
            <UFormField
              label="URL"
              name="url"
            >
              <UInput
                v-model="state.url"
                class="w-full"
              />
            </UFormField>
          </UForm>
        </div>

        <template #footer>
          <div class="h-8 w-full flex">
            <UButton
              form="set-link"
              type="submit"
              class="bg-slate-600"
            >
              Save
            </UButton>

            <span class="flex-1" />

            <UButton
              variant="solid"
              class="bg-slate-600"
              @click="$emit('cancel')"
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
const props = defineProps<{
  initialValue: string;
}>();

defineEmits<{
  (e: 'update', newUrl: string): void;
  (e: 'cancel'): void;
}>();

/* --- State --- */
/**
 * Dialog open/close state
 */
const modalOpen = defineModel<boolean>('open');

/**
 * Link form state
 */
const state = reactive({
  url: '',
});

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
  state.url = props.initialValue;
};

const onDialogClose = () => {
  resetState();
};

/* --- Helper --- */
const resetState = () => {
  state.url = '';
};
</script>
