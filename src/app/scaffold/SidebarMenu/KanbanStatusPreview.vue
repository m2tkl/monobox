<template>
  <Teleport to="body">
    <div
      class="kanban-status-preview"
      :style="{
        left: `${left}px`,
        top: `${top}px`,
      }"
      @mouseenter="$emit('keep-open')"
      @mouseleave="$emit('schedule-close')"
      @focusin="$emit('keep-open')"
      @focusout="$emit('schedule-close')"
    >
      <div class="kanban-status-preview__panel">
        <div class="kanban-status-preview__header">
          <span class="kanban-status-preview__title">{{ status.name }}</span>
          <span class="kanban-status-preview__count">{{ status.count }}</span>
        </div>
        <div class="kanban-status-preview__content">
          <ul
            v-if="items.length > 0"
            class="kanban-status-preview__list"
          >
            <li
              v-for="item in items"
              :key="item.id"
            >
              <MemoLinkRow
                :to="`/${workspaceSlug}/${item.slug_title}`"
                :memo-title="item.title"
                :count="item.linkCount"
                :active="activeMemoSlug === item.slug_title"
              />
            </li>
          </ul>
          <p
            v-else
            class="kanban-status-preview__empty"
          >
            No memos
          </p>
          <NuxtLink
            v-if="status.count > itemLimit"
            :to="`/${workspaceSlug}?status=${encodeURIComponent(status.name)}`"
            class="kanban-status-preview__more sidebar-link"
          >
            Show all {{ status.count }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import MemoLinkRow from './MemoLinkRow.vue';

import type { GlobalStatusItem, GlobalStatusMemoListItem } from '~/app/features/memo-browsing/resource/read-model';

defineProps<{
  activeMemoSlug: string;
  itemLimit: number;
  items: GlobalStatusMemoListItem[];
  left: number;
  status: GlobalStatusItem;
  top: number;
  workspaceSlug: string;
}>();

defineEmits<{
  'keep-open': [];
  'schedule-close': [];
}>();
</script>

<style scoped>
.kanban-status-preview {
  position: fixed;
  z-index: 1300;
  width: min(24rem, calc(100vw - var(--app-sidebar-width) - 0.75rem));
  height: min(30rem, calc(100vh - var(--app-titlebar-height) - 1.5rem));
  padding-left: 0.625rem;
}

.kanban-status-preview::before {
  position: absolute;
  top: 0.125rem;
  bottom: 0.125rem;
  left: 0;
  width: 0.625rem;
  border-block: 1px solid color-mix(in srgb, var(--color-border-light) 68%, transparent);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-surface-hover) 58%, transparent),
    color-mix(in srgb, var(--color-background) 82%, transparent)
  );
  content: "";
}

.kanban-status-preview__panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: 0 0.5rem 0.5rem 0;
  background-color: var(--color-background);
  box-shadow: 0 18px 42px rgb(15 23 42 / 0.18);
  padding: 0.5rem;
}

.kanban-status-preview__header {
  display: flex;
  min-height: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
  padding: 0 0.25rem 0.5rem;
}

.kanban-status-preview__content {
  min-height: 0;
  overflow-y: auto;
  padding-top: 0.375rem;
}

.kanban-status-preview__title {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kanban-status-preview__count {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.kanban-status-preview__list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.kanban-status-preview__empty {
  margin: 0;
  padding: 0.75rem 0.25rem 0.375rem;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.kanban-status-preview__more {
  display: block;
  margin-top: 0.375rem;
  border-radius: 0.375rem;
  padding: 0.375rem 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
}
</style>
