<template>
  <aside class="context-view">
    <div class="context-view__header">
      <div class="context-view__title">
        <UIcon :name="iconKey.pageLink" />
        <span>Context View</span>
      </div>
      <div class="context-view__actions">
        <IconButton
          :icon="iconKey.openPanel"
          aria-label="Open in external window"
          :disabled="!memo"
          @click="$emit('open-window')"
        />
        <IconButton
          :icon="iconKey.close"
          aria-label="Close Context View"
          @click="$emit('close')"
        />
      </div>
    </div>

    <div
      ref="scrollContainer"
      class="context-view__body"
    >
      <div
        v-if="isLoading"
        class="context-view__state"
      >
        Loading...
      </div>
      <div
        v-else-if="hasError"
        class="context-view__state"
      >
        Failed to load memo.
      </div>
      <article
        v-else-if="memo"
        class="context-view__memo"
      >
        <h1 class="context-view__memo-title">
          {{ memo.title }}
        </h1>
        <div
          class="tiptap context-view__content"
          v-html="memoHtml"
        />
      </article>
      <div
        v-else
        class="context-view__state"
      >
        No memo selected.
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { JSONContent } from '@tiptap/vue-3';
import type { MemoDetail } from '~/models/memo';

import IconButton from '~/app/elements/IconButton.vue';
import { convertEditorJsonToHtml } from '~/app/features/editor';

const props = defineProps<{
  memo: MemoDetail | null;
  isLoading: boolean;
  hasError: boolean;
  targetHash: string;
}>();

defineEmits<{
  'close': [];
  'open-window': [];
}>();

const memoHtml = computed(() => {
  if (!props.memo) {
    return '';
  }

  try {
    return convertEditorJsonToHtml(JSON.parse(props.memo.content) as JSONContent);
  }
  catch {
    return '';
  }
});

const scrollContainer = ref<HTMLElement | null>(null);

const scrollToTargetHash = async () => {
  if (!props.targetHash) {
    return;
  }

  await nextTick();

  const targetId = props.targetHash.replace(/^#/, '');
  const target = scrollContainer.value?.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
  target?.scrollIntoView({ block: 'start' });
};

watch(() => [props.memo?.id, props.targetHash, memoHtml.value] as const, () => {
  void scrollToTargetHash();
}, { immediate: true });
</script>

<style scoped>
.context-view {
  display: flex;
  flex-direction: column;
  min-width: 320px;
  max-width: 420px;
  height: 100%;
  border-left: 1px solid var(--color-border-light);
  background-color: var(--color-surface-elevated);
}

.context-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 2rem;
  padding: 0 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
  background-color: var(--color-surface);
}

.context-view__title,
.context-view__actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.context-view__title {
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.context-view__body {
  min-height: 0;
  flex: 1;
  overflow: auto;
}

.context-view__memo {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem;
}

.context-view__memo-title {
  margin: 0 0 1.25rem;
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.context-view__content {
  color: var(--color-text-primary);
}

.context-view__content :deep([id]) {
  scroll-margin-top: 24px;
}

.context-view__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  padding: 1.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

@media (max-width: 1100px) {
  .context-view {
    min-width: 0;
    max-width: none;
    width: 100%;
    height: 42%;
    border-left: 0;
    border-top: 1px solid var(--color-border-light);
  }
}
</style>
