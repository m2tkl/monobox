<template>
  <div
    v-if="isOpen"
    class="size-full"
  >
    <div class="flex h-full flex-col px-2 py-1">
      <div class="min-h-0 flex-1 overflow-y-auto">
        <WorkspaceSwitcher />

        <nav
          v-if="workspaceSlug"
          class="sidebar-primary-nav"
          aria-label="Workspace views"
        >
          <div
            v-for="action in orderedActions"
            :key="action.key"
            draggable="true"
            class="sidebar-primary-item"
            :class="{
              'is-dragging': draggedActionKey === action.key,
              'drop-before': dropActionKey === action.key && dropPosition === 'before',
              'drop-after': dropActionKey === action.key && dropPosition === 'after',
            }"
            @dragstart="onActionDragStart(action.key)"
            @dragover.prevent="onActionDragOver($event, action.key)"
            @drop.prevent="onActionDrop(action.key)"
            @dragend="clearActionDragState"
          >
            <AppButton
              :to="getTabPageLocation(workspaceSlug, action.page)"
              :icon="action.icon"
              :label="action.label"
              color="neutral"
              variant="ghost"
              size="sm"
              block
              class="sidebar-primary-link"
              :class="{ 'sidebar-primary-link--active': isWorkspaceViewActive(action.page) }"
              :aria-label="action.key === 'focus' ? `Focus (${activeFocusCount})` : action.label"
              @click.prevent="openWorkspaceView(action.page)"
            >
              <template
                v-if="action.key === 'focus'"
                #trailing
              >
                <span class="sidebar-primary-count">{{ activeFocusCount }}</span>
              </template>
            </AppButton>
          </div>
        </nav>

        <OpenPagesList
          v-if="workspaceSlug"
          :workspace-slug="workspaceSlug"
        />
      </div>

      <div
        v-if="workspaceSlug"
        class="sidebar-footer border-top pt-2 pb-2"
      >
        <div class="sidebar-footer-actions">
          <NuxtLink
            :to="{ path: '/_setting', query: { workspace: workspaceSlug } }"
            class="sidebar-action sidebar-link"
          >
            <UIcon
              :name="iconKey.setting"
              class="shrink-0"
            />
            <span class="sidebar-action-label">Settings</span>
          </NuxtLink>
          <ThemeToggle />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DEFAULT_SIDEBAR_ACTION_ORDER,
  parseSidebarActionOrder,
  reorderSidebarActions,
  SIDEBAR_ACTION_ORDER_STORAGE_KEY,
  type SidebarActionKey,
} from './sidebarActionOrder';
import WorkspaceSwitcher from './WorkspaceSwitcher.vue';

import type { TabPage } from '~/app/features/open-pages/openPages';

import AppButton from '~/app/elements/AppButton.vue';
import { useFocusListReadModel } from '~/app/features/memo-browsing';
import { OpenPagesList } from '~/app/features/open-pages';
import {
  BOOKMARKS_PAGE,
  CALENDAR_PAGE,
  FILES_PAGE,
  FOCUS_PAGE,
  getTabPageLocation,
  KANBAN_PAGE,
} from '~/app/features/open-pages/openPages';
import ThemeToggle from '~/app/scaffold/ThemeToggle.vue';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

defineProps<{ isOpen: boolean }>();

defineEmits<{
  'floating-preview-enter': [];
  'floating-preview-leave': [];
}>();

const route = useRoute();
const router = useRouter();
const focusListVM = useFocusListReadModel();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const activeFocusCount = computed(() => focusListVM.value.data.activeItems.length);
const actionOrder = ref<SidebarActionKey[]>([...DEFAULT_SIDEBAR_ACTION_ORDER]);
const actionOrderReady = ref(false);
const draggedActionKey = ref<SidebarActionKey | null>(null);
const dropActionKey = ref<SidebarActionKey | null>(null);
const dropPosition = ref<'before' | 'after' | null>(null);
const actions: Record<SidebarActionKey, { key: SidebarActionKey; label: string; icon: string; page: TabPage }> = {
  focus: { key: 'focus', label: 'Focus', icon: iconKey.focus, page: FOCUS_PAGE },
  bookmarks: { key: 'bookmarks', label: 'Bookmarks', icon: iconKey.bookmark, page: BOOKMARKS_PAGE },
  kanban: { key: 'kanban', label: 'Kanban', icon: iconKey.kanban, page: KANBAN_PAGE },
  files: { key: 'files', label: 'Files', icon: iconKey.folder, page: FILES_PAGE },
  calendar: { key: 'calendar', label: 'Calendar', icon: iconKey.calendar, page: CALENDAR_PAGE },
};
const orderedActions = computed(() => actionOrder.value.map(key => actions[key]));

const isWorkspaceViewActive = (page: TabPage) => (
  route.path === `/${workspaceSlug.value}${page.routePath}`
);

const openWorkspaceView = async (page: TabPage) => {
  if (!workspaceSlug.value) return;

  await router.replace(getTabPageLocation(workspaceSlug.value, page));
};

const clearActionDragState = () => {
  draggedActionKey.value = null;
  dropActionKey.value = null;
  dropPosition.value = null;
};

const onActionDragStart = (key: SidebarActionKey) => {
  draggedActionKey.value = key;
};

const onActionDragOver = (event: DragEvent, key: SidebarActionKey) => {
  if (!draggedActionKey.value || draggedActionKey.value === key) return;
  const element = event.currentTarget as HTMLElement | null;
  if (!element) return;

  const rect = element.getBoundingClientRect();
  dropActionKey.value = key;
  dropPosition.value = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
};

const onActionDrop = (targetKey: SidebarActionKey) => {
  if (!draggedActionKey.value || !dropPosition.value) {
    clearActionDragState();
    return;
  }

  actionOrder.value = reorderSidebarActions(
    actionOrder.value,
    draggedActionKey.value,
    targetKey,
    dropPosition.value,
  );
  clearActionDragState();
};

onMounted(() => {
  const storedOrder = typeof localStorage === 'undefined'
    ? null
    : localStorage.getItem(SIDEBAR_ACTION_ORDER_STORAGE_KEY);
  actionOrder.value = parseSidebarActionOrder(storedOrder);
  actionOrderReady.value = true;
});

watch(actionOrder, (order) => {
  if (actionOrderReady.value && typeof localStorage !== 'undefined') {
    localStorage.setItem(SIDEBAR_ACTION_ORDER_STORAGE_KEY, JSON.stringify(order));
  }
}, { deep: true });
</script>

<style scoped>
.sidebar-primary-nav {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 0.25rem;
  padding: 0.375rem 0 0.625rem;
}

.sidebar-primary-item {
  position: relative;
}

.sidebar-primary-item.is-dragging {
  opacity: 0.5;
}

.sidebar-primary-item.drop-before {
  box-shadow: inset 0 2px 0 var(--color-primary);
}

.sidebar-primary-item.drop-after {
  box-shadow: inset 0 -2px 0 var(--color-primary);
}

:deep(.sidebar-primary-link) {
  justify-content: flex-start;
  min-height: 2rem;
  padding-inline: 0.5rem;
}

:deep(.sidebar-primary-link--active),
:deep(.sidebar-primary-link--active:hover) {
  background: var(--color-sidebar-item-active);
  color: var(--color-text-primary);
}

.sidebar-primary-count {
  margin-left: auto;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1;
}

.sidebar-footer-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.sidebar-action {
  display: flex;
  min-height: 1.75rem;
  flex: 1;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.375rem;
  padding: 0.1875rem 0.5rem;
  font-size: 0.875rem;
}
</style>
