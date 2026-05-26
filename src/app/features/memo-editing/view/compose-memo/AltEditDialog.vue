<template>
  <UModal v-model:open="modalOpen">
    <template #content>
      <UCard>
        <div class="h-24">
          <UForm
            id="set-alt"
            :state="imageState"
            class="space-y-4"
            @submit="updateImgAlt"
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
            <AppButton
              form="set-alt"
              type="submit"
              class="bg-slate-600"
            >
              Save
            </AppButton>

            <span class="flex-1" />

            <AppButton
              variant="solid"
              class="bg-slate-600"
              @click="cancel"
            >
              Cancel
            </AppButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core';

const props = defineProps<{
  editor: Editor;
}>();

const emit = defineEmits<{
  (e: 'exit'): void;
}>();

/* --- State --- */
const modalOpen = defineModel<boolean>('open');

/**
 * Image alt text
 */
const imageState = reactive({
  alt: '',
});

/* --- Setup / Cleanup --- */
watch(modalOpen, (isOpen) => {
  if (isOpen) {
    const selection = props.editor.state.selection;

    if (selection) {
      const { $from } = selection;
      const node = $from.nodeAfter;
      if (node && node.type.name === 'image') {
        imageState.alt = node.attrs.alt || '';
      }
    }
  }
  else {
    resetState();
  }
});

/* --- Helper --- */
const resetState = () => {
  imageState.alt = '';
};

/* --- Actions --- */
const updateImgAlt = () => {
  props.editor.commands.updateAttributes('image', { alt: imageState.alt });
  emit('exit');
};

const cancel = () => {
  emit('exit');
};
</script>
