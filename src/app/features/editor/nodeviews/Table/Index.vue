<template>
  <node-view-wrapper class="table-node-view">
    <div
      v-if="showToolbar"
      class="table-node-view-toolbar"
      contenteditable="false"
    >
      <span
        v-if="tableName"
        class="table-node-view-title"
      >
        {{ tableName }}
      </span>
      <button
        type="button"
        aria-label="Copy table as Markdown"
        class="table-node-view-copy-button"
        contenteditable="false"
        @click="copyToClipboard"
      >
        <UIcon
          :name="iconKey.copy"
          class="table-node-view-copy-icon"
        />
      </button>
    </div>

    <node-view-content
      as="table"
      class="table-node-view-content"
    />
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps, type NodeViewProps } from '@tiptap/vue-3';
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue';

import { serializeTableNodeToHtml, serializeTableNodeToMarkdown } from './markdown';

import { iconKey } from '~/utils/icon';

defineComponent({
  props: nodeViewProps,
}) as Component<NodeViewProps>;

const props = defineProps(nodeViewProps);
const toast = useToast();
const isSelectionInsideTable = ref(false);

const tableName = computed(() => {
  const value = props.node.attrs.name;
  return typeof value === 'string' ? value.trim() : '';
});

function updateSelectionState() {
  const position = props.getPos?.();
  if (typeof position !== 'number') {
    isSelectionInsideTable.value = false;
    return;
  }

  const { from, to } = props.editor.state.selection;
  const tableFrom = position;
  const tableTo = position + props.node.nodeSize;
  isSelectionInsideTable.value = from >= tableFrom && to <= tableTo;
}

const showToolbar = computed(() => isSelectionInsideTable.value);

onMounted(() => {
  updateSelectionState();
  props.editor.on('selectionUpdate', updateSelectionState);
  props.editor.on('transaction', updateSelectionState);
});

onBeforeUnmount(() => {
  props.editor.off('selectionUpdate', updateSelectionState);
  props.editor.off('transaction', updateSelectionState);
});

const copyToClipboard = async () => {
  try {
    const markdown = serializeTableNodeToMarkdown(props.node);
    const html = serializeTableNodeToHtml(props.node);

    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([markdown], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ]);
    }
    else {
      await navigator.clipboard.writeText(markdown);
    }

    toast.add({
      title: 'Copied!',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error('Failed to copy table:', error);
    toast.add({
      title: 'Failed to copy.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};
</script>
