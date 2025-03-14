<template>
  <node-view-wrapper class="code-block">
    <!-- Header Section -->
    <div class="code-block-header pb-2">
      <!-- Name Input -->
      <UInput
        v-model="codeBlockName"
        size="xs"
        class="flex-1 pr-2 font-semibold text-slate-300"
        variant="none"
        placeholder="Untitled"
      />

      <!-- Language Selector -->
      <USelect
        v-model="selectedLanguage"
        :options="languages"
        size="2xs"
        class="font-semibold text-slate-300"
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

const codeBlockRef = ref();

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
    const codeElement = codeBlockRef.value.querySelector('pre code');
    const codeContent = (codeElement ? codeElement.innerText : '').trimEnd();

    await navigator.clipboard.writeText(codeContent);

    toast.add({
      title: 'Copied!',
      timeout: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error('Failed to copy code:', error);

    toast.add({
      title: 'Failed to copy.',
      color: 'red',
      icon: iconKey.failed,
    });
  }
};
</script>

<style>
.tiptap {
  .code-block {
    position: relative;
  }

  .code-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #232B3B;
    transition: background 0.2s ease-in-out, border-bottom 0.2s ease-in-out;
    border-radius: 8px 8px 0 0;
    padding: 6px 10px;
    border-bottom: 2px solid #424851;
  }

  .code-block-header:hover {
    border-bottom: 2px solid #4285F4;
  }
}
</style>
