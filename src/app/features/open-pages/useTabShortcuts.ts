import { onBeforeUnmount, onMounted, type Ref } from 'vue';

import {
  getLocationAfterTabClose,
  getTabPageLocation,
  isStandaloneWorkspaceView,
  NEW_TAB_PAGE,
} from './openPages';
import { useOpenPagesStore } from './openPagesStore';
import { getTabShortcutAction } from './tabShortcut';

import { isMac } from '~/utils/platform';

export function useTabShortcuts(workspaceSlug: Ref<string>) {
  const router = useRouter();
  const route = useRoute();
  const openPages = useOpenPagesStore();

  async function handleKeydown(event: KeyboardEvent) {
    const action = getTabShortcutAction(event, isMac);
    if (!action) return;
    const slug = workspaceSlug.value;
    if (!slug) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;

    if (action === 'new') {
      openPages.createTab(slug);
      await router.replace(getTabPageLocation(slug, NEW_TAB_PAGE));
      return;
    }

    if (action === 'restore') {
      const tab = openPages.restoreLastClosed(slug);
      if (tab) await router.replace(getTabPageLocation(slug, tab));
      return;
    }

    if (action === 'close') {
      if (isStandaloneWorkspaceView(route, slug)) return;
      const activeTabId = openPages.activeTabIds[slug];
      if (!activeTabId) return;
      const result = openPages.close(slug, activeTabId);
      if (!result) return;
      const destination = getLocationAfterTabClose(slug, result);
      if (destination) await router.replace(destination);
      return;
    }

    const tabs = openPages.tabs.filter(tab => tab.workspaceSlug === slug);
    if (tabs.length <= 1) return;

    const currentIndex = tabs.findIndex(tab => tab.id === openPages.activeTabIds[slug]);
    const offset = action === 'previous' ? -1 : 1;
    const nextIndex = currentIndex < 0
      ? (action === 'previous' ? tabs.length - 1 : 0)
      : (currentIndex + offset + tabs.length) % tabs.length;
    const tab = tabs[nextIndex];
    if (!tab) return;

    openPages.activate(slug, tab.id);
    await router.replace(getTabPageLocation(slug, tab));
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown, true));
  onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown, true));
}
