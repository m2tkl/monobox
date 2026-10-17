<template>
  <ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-0">
    <li
      v-for="memo in memos"
      :key="memo.id"
      class="memo-card-item aspect-[1/1] overflow-hidden rounded-lg"
      :class="{ 'memo-card-item--done': isDoneForToday(memo.slug_title) }"
    >
      <NuxtLink :to="`/${route.params.workspace}/${memo.slug_title}`">
        <MemoThumbnail
          :title="truncateString(extractsTitleParts(memo.title).memoTitle, TITLE_TRUNCATE)"
          :context="extractsTitleParts(memo.title).context"
          :description="memo.description"
          :thumbnail-image="memo.thumbnail_image"
          :is-bookmarked="bookmarkedMemoIdSet.has(memo.id)"
          :reserve-top-right-action="showDoneForToday"
        />
      </NuxtLink>
      <IconButton
        v-if="showDoneForToday"
        :icon="isDoneForToday(memo.slug_title) ? iconKey.renew : iconKey.success"
        :aria-label="isDoneForToday(memo.slug_title) ? 'Undo done for today' : 'Done for today'"
        class="memo-card-done-action"
        :disabled="pendingDoneForTodayMemoSlugSet.has(memo.slug_title)"
        @click="isDoneForToday(memo.slug_title)
          ? emit('undo-done-for-today', memo.slug_title)
          : emit('done-for-today', memo.slug_title)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import MemoThumbnail from './MemoThumbnail.vue';

import type { MemoIndexItem } from '~/models/memo';

import { iconKey } from '~/utils/icon';

const props = defineProps<{
  memos: MemoIndexItem[];
  bookmarkedMemoIds?: number[];
  showDoneForToday?: boolean;
  doneForTodayMemoSlugs?: ReadonlySet<string>;
  pendingDoneForTodayMemoSlugs?: string[];
}>();

const emit = defineEmits<{
  'done-for-today': [memoSlug: string];
  'undo-done-for-today': [memoSlug: string];
}>();

const TITLE_TRUNCATE = 32;

const route = useRoute();
const bookmarkedMemoIdSet = computed(() => new Set(props.bookmarkedMemoIds ?? []));
const doneForTodayMemoSlugSet = computed(() => new Set(props.doneForTodayMemoSlugs ?? []));
const pendingDoneForTodayMemoSlugSet = computed(() => new Set(props.pendingDoneForTodayMemoSlugs ?? []));
const isDoneForToday = (memoSlug: string) => doneForTodayMemoSlugSet.value.has(memoSlug);

function extractsTitleParts(title: string): { memoTitle: string; context: string } {
  const parts = title.split('/');
  const memoTitle = parts.pop() ?? title;
  return { memoTitle, context: parts.join('/') };
}
</script>

<style scoped>
.memo-card-item {
  position: relative;
}

.memo-card-item :deep(.memo-card-done-action) {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  z-index: 2;
  visibility: visible;
  opacity: 1;
  transition-duration: 60ms;
  background: var(--color-surface);
  box-shadow:
    0 0 0 1px var(--color-border-light),
    0 1px 4px color-mix(in srgb, var(--color-text-primary) 18%, transparent);
}

.memo-card-item--done :deep(.memo-link-title) {
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.memo-card-item--done :deep(.memo-link-description) {
  color: var(--color-text-muted);
}

/* Completely hide any dividers in the card */
:deep(.divide-y > *) {
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.divide-gray-200 > *) {
  border-top: none !important;
}

:deep([class*="divide-"]) {
  border: none !important;
}
</style>
