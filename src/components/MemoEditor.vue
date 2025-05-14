<template>
  <div class="bg-slate-100">
    <!-- Toolbar -->
    <div
      class="sticky h-8 left-0 top-0 z-50 border-b-2 border-slate-400 bg-slate-200"
    >
      <div
        class="h-8 flex items-center gap-0.5 overflow-auto px-2"
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
    <div class="max-w-[820px] bg-white p-6">
      <TitleFieldAutoResize v-model="memoTitle" />

      <div class="relative">
        <USeparator class="py-6" />

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
      class="flex gap-0.5 rounded-lg bg-slate-200 p-1 outline outline-slate-400"
    >
      <slot
        name="bubble-menu"
        :editor="editor"
      />
    </BubbleMenu>
  </div>
</template>

<script setup lang="ts">
import { BubbleMenu, EditorContent } from '@tiptap/vue-3';

import type { Editor } from '@tiptap/vue-3';

defineProps<{
  editor: Editor;
}>();

const memoTitle = defineModel<string>('memoTitle', { required: true });

const editorReady = ref(false);

onMounted(async () => {
  setTimeout(() => {
    editorReady.value = true;
  }, 0);
});
</script>
