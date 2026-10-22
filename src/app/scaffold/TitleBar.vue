<template>
  <div
    data-tauri-drag-region
    class="titlebar"
  >
    <div
      class="titlebar-sidebar"
      data-tauri-drag-region
    >
      <WindowControls placement="sidebar" />

      <div
        v-if="workspaceSlug"
        class="titlebar-sidebar__controls"
        data-tauri-drag-region
      >
        <IconButton
          :icon="ui.isSidebarOpen ? iconKey.sidebarClose : iconKey.sidebarOpen"
          @click="toggleSidebar"
        />

        <template v-if="!ui.isSidebarOpen">
          <IconButton
            :icon="iconKey.add"
            :disabled="isNavigatingToNewMemo"
            aria-label="New memo"
            @click="goToNewMemo()"
          />
        </template>
      </div>
    </div>

    <div
      class="titlebar-main"
      data-tauri-drag-region
    >
      <div
        v-if="route.path !== '/'"
        class="titlebar-home"
      >
        <AppButtonGroup
          class="titlebar-navigation-group"
          size="xs"
        >
          <IconButton
            :icon="iconKey.arrowLeft"
            :disabled="workspaceSlug ? !canGoBack : false"
            aria-label="Back"
            @click="goBack"
          />
          <IconButton
            :icon="iconKey.arrowRight"
            :disabled="workspaceSlug ? !canGoForward : false"
            aria-label="Forward"
            @click="goNext"
          />
        </AppButtonGroup>

        <IconButton
          v-if="workspaceSlug"
          :icon="iconKey.home"
          aria-label="Home"
          @click="goHome"
        />
      </div>

      <div
        v-if="workspaceSlug"
        class="titlebar-omnibox"
      >
        <AppButton
          class="titlebar-omnibox__search"
          :icon="iconKey.search"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="openSearch"
        >
          <span class="titlebar-omnibox__label">
            {{ activeTabTitle }}<span v-if="activeTabHash">{{ activeTabHash }}</span>
          </span>
        </AppButton>

        <BookmarkButton
          v-if="bookmarkMemoSlug"
          :workspace-slug="workspaceSlug"
          :memo-slug="bookmarkMemoSlug"
        />
      </div>

      <div
        v-else
        class="titlebar-route"
        data-tauri-drag-region
      />

      <div
        class="titlebar-actions"
        data-tauri-drag-region
      >
        <WindowControls placement="actions" />
        <IconButton
          v-if="workspaceSlug"
          :icon="iconKey.shuffle"
          :disabled="workspaceMemos.length === 0"
          aria-label="Random memo"
          title="Random memo"
          @click="openRandomMemo"
        />

        <!-- Windows controls appear here for Windows platform -->
      </div>
    </div>
  </div>

  <SearchPalette
    v-if="workspaceSlug"
    ref="searchPaletteRef"
    :workspace-slug="workspaceSlug"
    :memos="workspaceMemos"
    type="search"
    search-modes
    shortcut-symbol="k"
    @navigate="openSearchResult"
  >
    <template #actions="{ close, mode }">
      <AppButton
        v-if="mode === 'files'"
        :icon="iconKey.documentAttachment"
        color="neutral"
        variant="ghost"
        size="sm"
        class="mr-auto"
        @click="openStandalonePage({ memoSlug: null, routePath: '/_files', title: 'Files' }, close)"
      >
        Browse files
      </AppButton>
      <AppButton
        :icon="iconKey.calendar"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="openStandalonePage({ memoSlug: null, routePath: '/_calendar', title: 'Calendar' }, close)"
      >
        Calendar
      </AppButton>
    </template>
  </SearchPalette>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import type { SearchLaunchOptions, SearchOpenDestination } from '~/app/features/search';
import type { SearchNavigationTarget } from '~/app/features/search/view/search-palette/useSearchPalette';

import AppButton from '~/app/elements/AppButton.vue';
import AppButtonGroup from '~/app/elements/AppButtonGroup.vue';
import IconButton from '~/app/elements/IconButton.vue';
import { useWorkspaceMemosReadModel } from '~/app/features/memo-browsing';
import BookmarkButton from '~/app/features/memo-editing/view/bookmark-memo/BookmarkButton.vue';
import { findActiveWorkspaceTab, getStandaloneWorkspaceViewUrl, getTabPageLocation, NEW_TAB_PAGE, type TabPage } from '~/app/features/open-pages/openPages';
import { useOpenPagesStore } from '~/app/features/open-pages/openPagesStore';
import { pickRandomMemoPage } from '~/app/features/open-pages/randomMemoPage';
import { useTabShortcuts } from '~/app/features/open-pages/useTabShortcuts';
import { registerSearchLauncher, SearchPalette } from '~/app/features/search';
import { useTitleBarWorkspace } from '~/app/scaffold/useTitleBarWorkspace';
import WindowControls from '~/app/scaffold/WindowControls.vue';

defineProps<{
  workspaceTitle?: string;
}>();

const router = useRouter();
const {
  route,
  workspaceSlug,
  memoTitleSlug,
  workspaceReadModel,
} = useTitleBarWorkspace();

useTabShortcuts(workspaceSlug);

const { ui, toggleSidebar } = useUIState();
const isNavigatingToNewMemo = ref(false);
const searchPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null);
const workspaceMemosVM = useWorkspaceMemosReadModel();
const workspaceMemos = computed(() => workspaceMemosVM.value.data.items);
const openPagesStore = useOpenPagesStore();
const { tabs, activeTabIds } = storeToRefs(openPagesStore);
const activeTab = computed(() => findActiveWorkspaceTab(
  tabs.value,
  activeTabIds.value,
  workspaceSlug.value,
));
const standaloneWorkspaceUrl = computed(() => getStandaloneWorkspaceViewUrl(route, workspaceSlug.value));
const activeTabTitle = computed(() => (
  standaloneWorkspaceUrl.value ?? activeTab.value?.title ?? (memoTitleSlug.value || 'Search or open a page')
));
const activeTabHash = computed(() => standaloneWorkspaceUrl.value ? '' : (activeTab.value?.hash ?? route.hash));
const bookmarkMemoSlug = computed(() => (
  memoTitleSlug.value && !memoTitleSlug.value.startsWith('_') ? memoTitleSlug.value : ''
));
const canGoBack = computed(() => standaloneWorkspaceUrl.value
  ? false
  : openPagesStore.canGoBack(workspaceSlug.value));
const canGoForward = computed(() => standaloneWorkspaceUrl.value
  ? false
  : openPagesStore.canGoForward(workspaceSlug.value));
let unregisterSearchLauncher: (() => void) | null = null;

const openSearch = (options: SearchLaunchOptions = {}) => {
  searchPaletteRef.value?.openCommandPalette('', options);
};

const navigateToHistoryPage = async (page: TabPage | null) => {
  if (!page || !workspaceSlug.value) return;

  await router.replace(getTabPageLocation(workspaceSlug.value, page));
};

const goBack = async () => {
  if (!workspaceSlug.value) {
    router.go(-1);
    return;
  }
  await navigateToHistoryPage(openPagesStore.goBack(workspaceSlug.value));
};

const goNext = async () => {
  if (!workspaceSlug.value) {
    router.go(1);
    return;
  }
  await navigateToHistoryPage(openPagesStore.goForward(workspaceSlug.value));
};

const goHome = async () => {
  const slug = workspaceReadModel.value.data.workspace?.slug_name || workspaceSlug.value || '';
  if (!slug) return;

  if (standaloneWorkspaceUrl.value) {
    openPagesStore.openOrActivatePageTab(slug, NEW_TAB_PAGE);
  }
  else {
    openPagesStore.resetActiveTab(slug);
  }
  await router.push(getTabPageLocation(slug, NEW_TAB_PAGE));
};

const openSearchResult = (
  target: SearchNavigationTarget,
  destination: SearchOpenDestination,
) => {
  if (!workspaceSlug.value) return;
  if (destination === 'new-tab' || standaloneWorkspaceUrl.value) {
    openPagesStore.createTab(workspaceSlug.value, target);
    return;
  }
  openPagesStore.openInActiveTab(workspaceSlug.value, target);
};

async function openStandalonePage(page: TabPage, closePalette: () => void) {
  if (!workspaceSlug.value) return;

  if (!activeTab.value || activeTab.value.memoSlug || activeTab.value.routePath) {
    openPagesStore.createTab(workspaceSlug.value);
  }

  openPagesStore.openInActiveTab(workspaceSlug.value, page);
  closePalette();
  await router.push(getTabPageLocation(workspaceSlug.value, page));
}

async function openRandomMemo() {
  const page = pickRandomMemoPage(workspaceMemos.value);
  if (!page || !workspaceSlug.value) return;

  if (standaloneWorkspaceUrl.value) {
    openPagesStore.createTab(workspaceSlug.value, page);
  }
  else {
    openPagesStore.openInActiveTab(workspaceSlug.value, page);
  }
  await router.push(getTabPageLocation(workspaceSlug.value, page));
}

onMounted(() => {
  unregisterSearchLauncher = registerSearchLauncher(openSearch);
});

onUnmounted(() => {
  unregisterSearchLauncher?.();
  unregisterSearchLauncher = null;
});

async function goToNewMemo() {
  if (!workspaceSlug.value) {
    return;
  }

  isNavigatingToNewMemo.value = true;
  try {
    await router.push({
      path: `/${workspaceSlug.value}/__new__`,
    });
  }
  finally {
    isNavigatingToNewMemo.value = false;
  }
}
</script>

<style scoped>
/* Title bar utilities */
.titlebar {
  display: flex;
  align-items: center;
  height: var(--app-titlebar-height);
  width: 100%;
  color: var(--color-text-primary);
  padding: 0;
  user-select: none;
  overscroll-behavior: none;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--color-border-light);
  background-color: var(--color-background);
}

.titlebar-sidebar {
  display: flex;
  align-items: center;
  width: var(--app-sidebar-width);
  height: 100%;
  min-width: var(--app-sidebar-width);
  background-color: var(--color-background);
  border-right: 1px solid var(--color-border-light);
}

.titlebar-sidebar__controls {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  gap: 0.375rem;
  padding-left: 1rem;
  padding-right: 0.75rem;
}

.titlebar-main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  align-items: center;
  gap: 0.25rem;
  height: 100%;
  padding: 0 1rem 0 0.5rem;
  background-color: var(--color-background);
}

.titlebar-home {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.titlebar-navigation-group {
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
  background: transparent;
}

.titlebar-route {
  grid-column: 2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
}

.titlebar-omnibox {
  display: flex;
  grid-column: 2;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 0.125rem;
  padding-right: 0.375rem;
  border: 1px solid var(--color-border-light);
  border-radius: 9999px;
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-sm);
  transition: background-color 0.15s ease;
}

.titlebar-omnibox:has(.titlebar-omnibox__search:hover),
.titlebar-omnibox:has(.titlebar-omnibox__search:focus-visible) {
  background: var(--color-surface-hover);
}

:deep(.titlebar-omnibox__search) {
  min-width: 0;
  flex: 1;
  justify-content: flex-start;
  border-radius: 9999px;
}

:deep(.titlebar-omnibox__search:hover),
:deep(.titlebar-omnibox__search:focus-visible) {
  background: transparent;
  box-shadow: none;
}

.titlebar-omnibox__label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.titlebar-actions {
  display: flex;
  grid-column: 3;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 0.125rem;
  height: 100%;
}

.titlebar-actions :deep(.window-controls.windows) {
  margin-right: -1rem;
  margin-left: 0.625rem;
}

.titlebar-search-text {
  color: var(--color-text-muted);
}
</style>
