<template>
  <node-view-wrapper class="code-block">
    <!-- Header Section -->
    <div class="code-block-header pb-2">
      <!-- Name Input -->
      <UInput
        v-model="codeBlockName"
        size="xs"
        class="flex-1 pr-2 font-semibold"
        variant="none"
        placeholder="Untitled"
        :ui="{
          base: 'text-slate-300',
        }"
      />

      <!-- Language Selector -->
      <USelect
        v-model="selectedLanguage"
        :items="languages"
        size="xs"
        placeholder="none"
        class="w-32 font-semibold"
        :ui="{ base: 'text-slate-300' }"
        variant="none"
      />

      <!-- Copy Button -->
      <IconButton
        :icon="iconKey.copy"
        class="text-slate-300"
        @click="copyToClipboard"
      />
    </div>

    <!-- Code Content -->
    <div ref="codeBlockRef">
      <pre><code><node-view-content /></code></pre>
    </div>
  </node-view-wrapper>
</template>

<script lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { computed, ref } from 'vue';

import type { NodeViewProps } from '@tiptap/vue-3';
</script>

<script lang="ts" setup>
defineComponent({
  props: nodeViewProps,
}) as Component<NodeViewProps>;

const props = defineProps(nodeViewProps);
const toast = useToast();

const languages = ref(
  props.extension.options.lowlight
    .listLanguages()
    .sort((a: string, b: string) => a.localeCompare(b)),
);

const codeBlockRef = ref<HTMLElement | null>(null);

const selectedLanguage = computed({
  get: () => props.node.attrs.language,
  set: (language: string) => {
    props.updateAttributes({ language });
  },
});

const codeBlockName = computed({
  get: () => props.node.attrs.name || '',
  set: (name: string) => {
    props.updateAttributes({ name });
  },
});

const copyToClipboard = async () => {
  try {
    const codeElement = codeBlockRef.value!.querySelector('pre code');
    const codeContent = (codeElement!.textContent ?? '').trimEnd();

    await navigator.clipboard.writeText(codeContent);

    toast.add({
      title: 'Copied!',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error('Failed to copy code:', error);

    toast.add({
      title: 'Failed to copy.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};
</script>

<style>
.tiptap .code-block {
  position: relative;
  font-weight: 500;
}

.tiptap .code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #232B3B;
  transition: background 0.2s ease-in-out, border-bottom 0.2s ease-in-out;
  border-radius: 8px 8px 0 0;
  padding: 6px 10px;
  border-bottom: 2px solid #424851;
}

.tiptap .code-block-header:hover {
  border-bottom: 2px solid #4285F4;
}

select {
  font-family: 'Arial', sans-serif;
}
</style>
