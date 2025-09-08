<template>
  <MemoEditor
    v-if="editor"
    v-model:memo-title="memoTitle"
    :editor="editor"
  >
    <template #toolbar="slotProps">
      <slot
        name="toolbar"
        v-bind="slotProps"
      />
    </template>

    <template #context-menu>
      <slot name="context-menu" />
    </template>

    <template #bubble-menu>
      <slot name="bubble-menu" />
    </template>

    <template #dialogs="slotProps">
      <slot
        name="dialogs"
        v-bind="slotProps"
      />
    </template>
  </MemoEditor>
</template>

<script setup lang="ts">
import type { Editor as _Editor } from '@tiptap/vue-3';

import MemoEditor from '~/components/MemoEditor.vue';

defineProps<{
  editor: _Editor | null | undefined;
}>();

const memoTitle = defineModel<string>('memoTitle', { required: true });
</script>
