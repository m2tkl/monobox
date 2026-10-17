<template>
  <section class="open-pages">
    <ul class="open-pages__list">
      <li
        v-for="tab in tabs"
        :key="tab.id"
        draggable="true"
        class="open-pages__drop-target"
        :class="{
          'is-active': activeTabId === tab.id,
          'is-dragging': draggedTabId === tab.id,
          'drop-before': dropTabId === tab.id && dropPosition === 'before',
          'drop-after': dropTabId === tab.id && dropPosition === 'after',
        }"
        @dragstart="onDragStart(tab.id)"
        @dragover.prevent="onDragOver($event, tab.id)"
        @drop.prevent="onDrop(tab.id)"
        @dragend="clearDragState"
      >
        <MemoLinkRow
          class="open-pages__tab-link"
          :class="{ 'open-pages__tab-link--selected': activeTabId === tab.id }"
          :to="getTabLocation(tab)"
          :icon="getOpenPageIcon(tab)"
          :memo-title="tab.title"
          :active="activeTabId === tab.id"
          :aria-current="activeTabId === tab.id ? 'page' : undefined"
          @click.prevent="selectTab(tab.id)"
        />
        <span class="open-pages__close absolute inset-y-0 right-1 flex items-center justify-center">
          <IconButton
            :icon="iconKey.close"
            :aria-label="`Close ${tab.title}`"
            @click="closeTab(tab.id)"
          />
        </span>
      </li>
    </ul>

    <NewTabActions :workspace-slug="workspaceSlug" />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import NewTabActions from './NewTabActions.vue';
import { getOpenPageIcon } from './openPageIcons';
import {
  getLocationAfterTabClose,
  getTabPageLocation,
  isStandaloneWorkspaceView,
  type OpenTab,
} from './openPages';
import { useOpenPagesStore } from './openPagesStore';

import IconButton from '~/app/elements/IconButton.vue';
import MemoLinkRow from '~/app/scaffold/SidebarMenu/MemoLinkRow.vue';
import { iconKey } from '~/utils/icon';

const props = defineProps<{
  workspaceSlug: string;
}>();

const route = useRoute();
const router = useRouter();
const openPagesStore = useOpenPagesStore();
const { tabs: allTabs, activeTabIds } = storeToRefs(openPagesStore);
const draggedTabId = ref<string | null>(null);
const dropTabId = ref<string | null>(null);
const dropPosition = ref<'before' | 'after' | null>(null);

const tabs = computed(() => allTabs.value.filter(tab => tab.workspaceSlug === props.workspaceSlug));
const activeTabId = computed(() => (
  isStandaloneWorkspaceView(route, props.workspaceSlug)
    ? null
    : activeTabIds.value[props.workspaceSlug] ?? null
));

function getTabLocation(tab: OpenTab) {
  return getTabPageLocation(props.workspaceSlug, tab);
}

async function selectTab(tabId: string) {
  const tab = tabs.value.find(item => item.id === tabId);
  if (!tab) return;

  openPagesStore.activate(props.workspaceSlug, tabId);
  await router.replace(getTabLocation(tab));
}

async function closeTab(tabId: string) {
  const result = openPagesStore.close(props.workspaceSlug, tabId);
  if (!result) return;
  const destination = getLocationAfterTabClose(props.workspaceSlug, result);
  if (destination) await router.replace(destination);
}

function clearDragState() {
  draggedTabId.value = null;
  dropTabId.value = null;
  dropPosition.value = null;
}

function onDragStart(tabId: string) {
  draggedTabId.value = tabId;
}

function onDragOver(event: DragEvent, tabId: string) {
  if (!draggedTabId.value || draggedTabId.value === tabId) return;
  const element = event.currentTarget as HTMLElement | null;
  if (!element) return;

  const rect = element.getBoundingClientRect();
  dropTabId.value = tabId;
  dropPosition.value = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
}

function onDrop(targetTabId: string) {
  if (!draggedTabId.value || !dropPosition.value) {
    clearDragState();
    return;
  }

  openPagesStore.reorder(
    props.workspaceSlug,
    draggedTabId.value,
    targetTabId,
    dropPosition.value,
  );
  clearDragState();
}
</script>

<style scoped>
.open-pages {
  padding: 0.25rem 0 0.75rem;
}

.open-pages__list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-top: 0.125rem;
}

.open-pages__drop-target {
  position: relative;
}

.open-pages__drop-target.is-dragging {
  opacity: 0.5;
}

.open-pages__drop-target.drop-before {
  box-shadow: inset 0 2px 0 var(--color-primary);
}

.open-pages__drop-target.drop-after {
  box-shadow: inset 0 -2px 0 var(--color-primary);
}

:deep(.open-pages__tab-link) {
  padding-right: 1.5rem;
}

.open-pages__drop-target:hover :deep(.open-pages__tab-link) {
  background-color: var(--color-sidebar-item-hover);
  color: var(--color-text-primary);
}

.open-pages__drop-target :deep(.open-pages__tab-link--selected),
.open-pages__drop-target:hover :deep(.open-pages__tab-link--selected) {
  background-color: var(--color-sidebar-item-active);
  color: var(--color-text-primary);
  font-weight: bold;
}

.open-pages__close {
  opacity: 0;
  visibility: hidden;
}

.open-pages__drop-target:hover .open-pages__close {
  opacity: 1;
  visibility: visible;
}
</style>
