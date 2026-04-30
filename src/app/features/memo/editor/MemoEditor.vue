<template>
  <div style="background-color: var(--color-background)">
    <!-- Toolbar -->
    <div
      class="sticky h-8 left-0 top-0 z-50 border-b-1"
      style="border-color: var(--color-border-light); background-color: var(--color-surface)"
    >
      <div
        :class="['h-8 flex items-center gap-0.5 overflow-auto px-2', toolbarContainerClass]"
      >
        <slot
          name="toolbar"
          :editor="editor"
        />
        <div class="ml-auto" />
        <slot
          name="context-menu"
          :editor="editor"
        />
      </div>
    </div>

    <!-- Editor area -->
    <div
      :class="['p-6', contentContainerClass]"
      style="background-color: var(--color-surface-elevated)"
    >
      <TitleFieldStableInput
        ref="titleFieldRef"
        v-model="memoTitle"
      />

      <div class="relative">
        <USeparator
          class="py-6"
          style="border-color: var(--color-border-light) !important;"
        />

        <UProgress
          v-if="!editorReady"
          size="xs"
          color="info"
          class="absolute inset-x-0 top-6 mx-auto"
        />
      </div>

      <div
        class="size-full"
      >
        <EditorLoadingSkelton v-if="!editorReady" />

        <editor-content
          v-else
          :editor="editor"
        />
      </div>
    </div>

    <!-- Bubble menu -->
    <BubbleMenu
      :editor="editor"
      class="flex gap-0.5 rounded-lg p-1 outline"
      style="background-color: var(--color-surface); outline-color: var(--color-border-muted)"
    >
      <slot
        name="bubble-menu"
        :editor="editor"
      />
    </BubbleMenu>

    <slot
      name="dialogs"
      :editor="editor"
    />
  </div>
</template>

<script setup lang="ts">
import { BubbleMenu, EditorContent } from '@tiptap/vue-3';

import type { Editor } from '@tiptap/vue-3';

import EditorLoadingSkelton from '~/app/features/memo/editor/EditorLoadingSkelton.vue';
import TitleFieldStableInput from '~/app/features/memo/editor/TitleFieldStableInput.vue';

withDefaults(defineProps<{
  editor: Editor;
  // TODO: These layout hooks were added for the template editor dialog.
  // Prefer moving width/alignment control to the parent once MemoEditor's
  // internal structure is simplified enough to style from the outside.
  toolbarContainerClass?: string;
  contentContainerClass?: string;
}>(), {
  toolbarContainerClass: '',
  contentContainerClass: 'max-w-[820px]',
});

const memoTitle = defineModel<string>('memoTitle', { required: true });
const titleFieldRef = ref<InstanceType<typeof TitleFieldStableInput> | null>(null);

const editorReady = ref(false);

onMounted(async () => {
  setTimeout(() => {
    editorReady.value = true;
  }, 500);
});

function focusTitleField(selectAll = false) {
  if (selectAll) {
    titleFieldRef.value?.focusAndSelectAll();
    return;
  }
}

defineExpose({
  focusTitleField,
});
</script>

<style scoped>
/* Force separator color to match theme */
:deep(.separator) {
  border-color: var(--color-border-light) !important;
}

:deep(hr) {
  border-color: var(--color-border-light) !important;
}
</style>
