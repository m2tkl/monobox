<template>
  <section
    class="new-tab-section"
    :class="{ 'new-tab-section--recent': section.key === 'recent' }"
  >
    <header class="new-tab-section__header">
      <h2>{{ section.label }}</h2>
      <span>{{ section.items.length }}</span>
    </header>

    <MemoCards
      v-if="section.key === 'recent' && section.items.length > 0"
      :memos="section.items.slice(0, displayedItemLimit)"
      :bookmarked-memo-ids="bookmarkedMemoIds"
    />
    <ul
      v-else-if="section.items.length > 0"
      class="new-tab-section__list"
    >
      <li
        v-for="memo in section.items.slice(0, displayedItemLimit)"
        :key="memo.id"
      >
        <NuxtLink
          class="new-tab-section__item"
          :to="`/${workspaceSlug}/${memo.slug_title}`"
        >
          <span class="new-tab-section__item-title">{{ memo.title }}</span>
          <span class="new-tab-section__item-date">{{ formatDate(memo.modified_at) }}</span>
        </NuxtLink>
      </li>
    </ul>
    <p
      v-else
      class="new-tab-section__empty"
    >
      No items
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { NewTabSection } from '../useNewTabSections';

import MemoCards from '~/app/features/memo-browsing/view/memo-browsing/MemoCards.vue';
import { MEMO_BROWSING_PAGE_SIZE } from '~/app/features/memo-browsing/view/memo-browsing/pagination';

const props = defineProps<{
  section: NewTabSection;
  workspaceSlug: string;
  compactItemLimit: number;
  bookmarkedMemoIds?: number[];
}>();

const displayedItemLimit = computed(() => props.section.key === 'recent'
  ? MEMO_BROWSING_PAGE_SIZE
  : props.compactItemLimit);

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}
</script>

<style scoped>
.new-tab-section {
  min-width: 0;
  padding: 0.75rem;
  border: 1px solid var(--color-border-light);
  border-radius: calc(var(--ui-radius) * 1.5);
  background: color-mix(in srgb, var(--color-surface) 82%, transparent);
}

.new-tab-section--recent {
  grid-column: 1 / -1;
}

.new-tab-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.125rem 0.375rem 0.625rem;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 650;
}

.new-tab-section__list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.new-tab-section__item {
  display: flex;
  min-height: 2.25rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.375rem 0.5rem;
  border-radius: var(--ui-radius);
  color: var(--color-text-primary);
}

.new-tab-section__item:hover {
  background: var(--color-surface-muted);
}

.new-tab-section__item-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-tab-section__item-date,
.new-tab-section__empty {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.new-tab-section__empty {
  padding: 1rem 0.5rem;
}
</style>
