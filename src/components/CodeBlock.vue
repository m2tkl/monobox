<template>
  <node-view-wrapper class="code-block">
    <!-- Header Section -->
    <div class="code-block-header pb-2">
      <!-- Language Selector -->
      <USelect v-model="selectedLanguage" :options="languages" size="2xs" class="text-gray-600" />

      <!-- Name Input -->
      <UInput v-model="codeBlockName" size="xs" class="flex-1 pr-2 text-gray-600 font-semibold" variant="none" />

      <!-- Copy Button -->
      <IconButton :icon="iconKey.copy" @click="copyToClipboard" />
    </div>

    <!-- Code Content -->
    <div ref="codeBlockRef">
      <pre><code><node-view-content /></code></pre>
    </div>
  </node-view-wrapper>
</template>

<script lang="ts">
import { type NodeViewProps } from "@tiptap/vue-3";

export default defineComponent({
  props: nodeViewProps
}) as Component<NodeViewProps>;
</script>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from "@tiptap/vue-3";

const props = defineProps(nodeViewProps);
const toast = useToast()

const languages = ref(
  props.extension.options.lowlight
    .listLanguages()
    .sort((a: string, b: string) => a.localeCompare(b))
);

const codeBlockRef = ref()

const selectedLanguage = computed({
  get: () => props.node.attrs.language,
  set: (language: string) => {
    props.updateAttributes({ language });
  },
});

const codeBlockName = computed({
  get: () => props.node.attrs.name || "",
  set: (name: string) => {
    props.updateAttributes({ name });
  },
});

const copyToClipboard = async () => {
  try {
    const codeElement = codeBlockRef.value.querySelector("pre code");
    const codeContent = (codeElement ? codeElement.innerText : "").trimEnd();

    await navigator.clipboard.writeText(codeContent);

    toast.add({
      title: "Copied!",
      timeout: 1000,
      icon: iconKey.success,
    });
  } catch (error) {
    console.error("Failed to copy code:", error);

    toast.add({
      title: "Failed to copy.",
      color: "red",
      icon: iconKey.failed,
    })
  }
};
</script>

<style>
.tiptap {
  .code-block {
    position: relative;

    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0 1rem;
    padding-top: 12px;
    margin-bottom: 1rem;
  }

  .code-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
