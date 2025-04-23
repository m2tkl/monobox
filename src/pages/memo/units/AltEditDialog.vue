<template>
  <UModal v-model:open="modalOpen">
    <template #content>
      <UCard>
        <div class="h-24">
          <UForm
            id="set-alt"
            :state="imageState"
            class="space-y-4"
            @submit="$emit('update', imageState.alt)"
          >
            <UFormField
              label="Alt"
              name="alt"
            >
              <UInput
                v-model="imageState.alt"
                class="w-full"
              />
            </UFormField>
          </UForm>
        </div>

        <template #footer>
          <div class="h-8 flex w-full">
            <UButton
              form="set-alt"
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
  (e: 'update', newAltText: string): void;
  (e: 'cancel'): void;
}>();

/* --- State --- */
/**
 * Dialog open/close state
 */
const modalOpen = defineModel<boolean>('open');

/**
 * Image alt text
 */
const imageState = reactive({
  alt: '',
});

/* --- Setup / Cleanup --- */
watch(() => props.initialValue, () => {
  imageState.alt = props.initialValue;
});

watch(modalOpen, (isOpen) => {
  if (isOpen) {
    onDialogOpen();
  }
  else {
    onDialogClose();
  }
});

const onDialogOpen = () => {
  imageState.alt = props.initialValue;
};

const onDialogClose = () => {
  resetState();
};

/* --- Helper --- */
const resetState = () => {
  imageState.alt = '';
};
</script>
