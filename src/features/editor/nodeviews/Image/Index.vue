<template>
  <node-view-wrapper
    as="figure"
    class="tiptap-image"
    contenteditable="false"
  >
    <ImageWithSkeleton
      :src="src"
      :alt="altText"
      container-class="editor-image-shell"
      img-class="editor-image"
      skeleton-class="editor-image-skeleton"
    />
    <figcaption
      style="font-size: 0.8em; text-align: center; margin-top: 4px;"
    >
      {{ altText }}
    </figcaption>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';

import ImageWithSkeleton from '~/shared/components/elements/ImageWithSkeleton.vue';
import { transformImageSrc } from '~/utils/imageSrc';

const props = defineProps(nodeViewProps);

const normalizeAttrString = (value: unknown) => {
  return typeof value === 'string' ? value : String(value ?? '');
};

const src = computed(() => transformImageSrc(normalizeAttrString(props.node.attrs.src)));
const altText = computed(() => normalizeAttrString(props.node.attrs.alt));
</script>

<style scoped>
.editor-image-shell {
  display: block;
}

.editor-image {
  box-shadow: 0 0 0 1px var(--color-surface);
  border-radius: var(--radius-lg);
  cursor: zoom-in;
  display: block;
  height: auto;
  margin-left: auto;
  margin-right: auto;
  max-width: 100%;
}

.editor-image-skeleton {
  min-height: 160px;
}

.editor-image-shell.image-skeleton-shell-loading {
  min-height: 160px;
}
</style>
