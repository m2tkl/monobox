<template>
  <UModal v-model:open="modalOpen">
    <template #content>
      <UCard>
        <div class="h-24">
          <UForm
            id="set-link"
            :state="state"
            class="space-y-4"
            @submit="updateLink"
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
          <div class="flex justify-end gap-2">
            <AppButton
              color="neutral"
              variant="ghost"
              @click="cancel"
            >
              Cancel
            </AppButton>
            <AppButton
              form="set-link"
              type="submit"
            >
              Save
            </AppButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core';

import { setLink, unsetLink } from '~/app/features/editor';

const props = defineProps<{
  editor: Editor;
}>();

const emit = defineEmits<{
  (e: 'exit'): void;
}>();

/* --- State --- */
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
    state.url = props.editor.getAttributes('link').href || '';
  }
  else {
    resetState();
  }
});

/* --- Helper --- */
const resetState = () => {
  state.url = '';
};

/* --- Actions --- */
const updateLink = () => {
  if (state.url) {
    setLink(props.editor, state.url);
  }
  else {
    unsetLink(props.editor);
  }

  emit('exit');
};

const cancel = () => {
  emit('exit');
};
</script>
