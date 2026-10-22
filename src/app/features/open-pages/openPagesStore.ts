import { defineStore } from 'pinia';

import {
  createTabHistory,
  currentHistoryPage,
  isFixedWorkspaceViewPath,
  moveTabHistory,
  NEW_TAB_PAGE,
  pushTabHistory,
  reorderWorkspaceTabs,
  replaceTabPage,
  type OpenTab,
  type CloseTabResult,
  type ClosedTab,
  type TabHistory,
  type TabPage,
} from './openPages';

function createTabId() {
  return globalThis.crypto?.randomUUID?.() ?? `tab-${Date.now()}-${Math.random()}`;
}

const MAX_CLOSED_TABS = 20;

function copyHistory(history: TabHistory): TabHistory {
  return {
    entries: history.entries.map(page => ({ ...page })),
    currentIndex: history.currentIndex,
  };
}

function pageFromTab(tab: OpenTab): TabPage {
  return {
    memoSlug: tab.memoSlug,
    routePath: tab.routePath ?? '',
    hash: tab.hash,
    title: tab.title,
  };
}

function resolveTabHistory(history: TabHistory | undefined, tab: OpenTab): TabHistory {
  if (
    !history
    || !Array.isArray(history.entries)
    || history.entries.length === 0
    || !Number.isInteger(history.currentIndex)
    || history.currentIndex < 0
    || history.currentIndex >= history.entries.length
  ) {
    return createTabHistory(pageFromTab(tab));
  }
  return history;
}

function withoutMemoFromHistory(history: TabHistory, memoSlug: string): TabHistory {
  const removedBeforeCurrent = history.entries
    .slice(0, history.currentIndex)
    .filter(page => page.memoSlug === memoSlug)
    .length;
  return {
    entries: history.entries.filter(page => page.memoSlug !== memoSlug),
    currentIndex: history.currentIndex - removedBeforeCurrent,
  };
}

export const useOpenPagesStore = defineStore('open-pages', {
  state: () => ({
    tabs: [] as OpenTab[],
    activeTabIds: {} as Record<string, string | null>,
    histories: {} as Record<string, TabHistory>,
    closedTabs: [] as ClosedTab[],
    activeTabOpeners: {} as Record<string, { tabId: string; page: TabPage } | undefined>,
  }),

  actions: {
    createTab(workspaceSlug: string, initialPage: TabPage = NEW_TAB_PAGE) {
      Reflect.deleteProperty(this.activeTabOpeners, workspaceSlug);
      const id = createTabId();
      const history = createTabHistory(initialPage);
      const page = currentHistoryPage(history) ?? NEW_TAB_PAGE;
      this.tabs.push({
        id,
        workspaceSlug,
        memoSlug: page.memoSlug,
        routePath: page.routePath,
        hash: page.hash ?? '',
        title: page.title,
        createdAt: Date.now(),
        isPinned: false,
      });
      this.histories[id] = history;
      this.activeTabIds[workspaceSlug] = id;
      return id;
    },

    pinTab(workspaceSlug: string, tabId: string) {
      const tab = this.tabs.find(tab => tab.workspaceSlug === workspaceSlug && tab.id === tabId);
      if (tab) tab.isPinned = true;
    },

    reconcileRenamedMemo(workspaceSlug: string, previousMemoSlug: string, memoSlug: string) {
      const renamePage = (page: TabPage) => {
        if (page.memoSlug === previousMemoSlug) page.memoSlug = memoSlug;
      };
      for (const tab of this.tabs) {
        if (tab.workspaceSlug !== workspaceSlug) continue;
        renamePage(tab);
        this.histories[tab.id]?.entries.forEach(renamePage);
      }
      for (const closed of this.closedTabs) {
        if (closed.tab.workspaceSlug !== workspaceSlug) continue;
        renamePage(closed.tab);
        closed.history.entries.forEach(renamePage);
      }
    },

    openOrActivatePageTab(workspaceSlug: string, page: TabPage) {
      Reflect.deleteProperty(this.activeTabOpeners, workspaceSlug);
      const existingTab = this.tabs.find(tab => (
        tab.workspaceSlug === workspaceSlug
        && tab.memoSlug === page.memoSlug
        && (tab.routePath ?? '') === (page.routePath ?? '')
        && tab.hash === (page.hash ?? '')
      ));
      if (existingTab) {
        this.activeTabIds[workspaceSlug] = existingTab.id;
        return existingTab.id;
      }

      return this.createTab(workspaceSlug, page);
    },

    discardFixedWorkspaceViewTabs(workspaceSlug: string) {
      Reflect.deleteProperty(this.activeTabOpeners, workspaceSlug);
      const discardedTabs = this.tabs.filter(tab => (
        tab.workspaceSlug === workspaceSlug && isFixedWorkspaceViewPath(tab.routePath)
      ));
      if (discardedTabs.length === 0) return;

      const discardedTabIds = new Set(discardedTabs.map(tab => tab.id));
      const remainingWorkspaceTabs = this.tabs.filter(tab => (
        tab.workspaceSlug === workspaceSlug && !discardedTabIds.has(tab.id)
      ));
      this.tabs = this.tabs.filter(tab => !discardedTabIds.has(tab.id));
      for (const tabId of discardedTabIds) Reflect.deleteProperty(this.histories, tabId);
      this.closedTabs = this.closedTabs.filter(item => !(
        item.tab.workspaceSlug === workspaceSlug
        && isFixedWorkspaceViewPath(item.tab.routePath)
      ));

      if (discardedTabIds.has(this.activeTabIds[workspaceSlug] ?? '')) {
        this.activeTabIds[workspaceSlug] = remainingWorkspaceTabs[0]?.id ?? null;
      }
    },

    openInActiveTab(workspaceSlug: string, page: TabPage) {
      const activeTabId = this.activeTabIds[workspaceSlug];
      let activeTab = this.tabs.find(tab => (
        tab.id === activeTabId && tab.workspaceSlug === workspaceSlug
      ));

      const samePage = (tab: OpenTab) => (
        tab.memoSlug === page.memoSlug
        && (tab.routePath ?? '') === (page.routePath ?? '')
      );
      const existingPinnedTab = this.tabs.find(tab => (
        tab.workspaceSlug === workspaceSlug && tab.isPinned && samePage(tab)
      ));
      if (existingPinnedTab && (!activeTab || !samePage(activeTab))) {
        activeTab = existingPinnedTab;
      }
      else if (activeTab?.isPinned && !samePage(activeTab)) {
        return this.createTab(workspaceSlug, page);
      }
      if (activeTab && activeTab.id !== activeTabId) {
        this.activate(workspaceSlug, activeTab.id);
      }

      if (!activeTab) {
        const id = this.createTab(workspaceSlug);
        const history = pushTabHistory(this.histories[id] ?? createTabHistory(), page);
        this.histories[id] = history;
        const currentPage = currentHistoryPage(history);
        if (currentPage) this.tabs = replaceTabPage(this.tabs, id, currentPage);
        return id;
      }

      const history = pushTabHistory(
        resolveTabHistory(this.histories[activeTab.id], activeTab),
        page,
      );
      this.histories[activeTab.id] = history;
      const currentPage = currentHistoryPage(history);
      if (currentPage) this.tabs = replaceTabPage(this.tabs, activeTab.id, currentPage);
      return activeTab.id;
    },

    resetActiveTab(workspaceSlug: string) {
      const activeTabId = this.activeTabIds[workspaceSlug];
      const activeTab = this.tabs.find(tab => (
        tab.id === activeTabId && tab.workspaceSlug === workspaceSlug
      ));

      if (!activeTab) {
        return this.createTab(workspaceSlug);
      }

      return this.openInActiveTab(workspaceSlug, NEW_TAB_PAGE);
    },

    moveActiveTabHistory(workspaceSlug: string, offset: -1 | 1) {
      const activeTabId = this.activeTabIds[workspaceSlug];
      const activeTab = this.tabs.find(tab => (
        tab.id === activeTabId && tab.workspaceSlug === workspaceSlug
      ));
      if (!activeTab) return null;

      const history = resolveTabHistory(this.histories[activeTab.id], activeTab);
      const nextHistory = moveTabHistory(history, offset);
      this.histories[activeTab.id] = nextHistory;
      if (nextHistory.currentIndex === history.currentIndex) return null;

      const page = currentHistoryPage(nextHistory);
      if (!page) return null;
      this.tabs = replaceTabPage(this.tabs, activeTab.id, page);
      return page;
    },

    goBack(workspaceSlug: string) {
      return this.moveActiveTabHistory(workspaceSlug, -1);
    },

    goForward(workspaceSlug: string) {
      return this.moveActiveTabHistory(workspaceSlug, 1);
    },

    canGoBack(workspaceSlug: string) {
      const tabId = this.activeTabIds[workspaceSlug];
      const history = tabId ? this.histories[tabId] : undefined;
      return !!history && history.currentIndex > 0;
    },

    canGoForward(workspaceSlug: string) {
      const tabId = this.activeTabIds[workspaceSlug];
      const history = tabId ? this.histories[tabId] : undefined;
      return !!history && history.currentIndex < history.entries.length - 1;
    },

    activate(workspaceSlug: string, tabId: string) {
      if (this.tabs.some(tab => tab.workspaceSlug === workspaceSlug && tab.id === tabId)) {
        if (this.activeTabIds[workspaceSlug] !== tabId) {
          Reflect.deleteProperty(this.activeTabOpeners, workspaceSlug);
        }
        this.activeTabIds[workspaceSlug] = tabId;
      }
    },

    setActiveTabOpener(workspaceSlug: string, tabId: string, page: TabPage) {
      if (this.activeTabIds[workspaceSlug] !== tabId) return;
      this.activeTabOpeners[workspaceSlug] = {
        tabId,
        page: { ...page },
      };
    },

    reconcileDeletedMemo(workspaceSlug: string, memoSlug: string): CloseTabResult | null {
      const workspaceTabs = this.tabs.filter(tab => tab.workspaceSlug === workspaceSlug);
      const removedTabs = workspaceTabs.filter(tab => tab.memoSlug === memoSlug);
      const removedTabIds = new Set(removedTabs.map(tab => tab.id));
      const activeTabId = this.activeTabIds[workspaceSlug];
      const wasActive = !!activeTabId && removedTabIds.has(activeTabId);

      let fallbackTab: OpenTab | null = null;
      if (wasActive) {
        const activeIndex = workspaceTabs.findIndex(tab => tab.id === activeTabId);
        fallbackTab = workspaceTabs
          .slice(activeIndex + 1)
          .find(tab => !removedTabIds.has(tab.id))
          ?? workspaceTabs
            .slice(0, activeIndex)
            .reverse()
            .find(tab => !removedTabIds.has(tab.id))
            ?? null;
      }

      const activeOpener = this.activeTabOpeners[workspaceSlug];
      const openerPage = wasActive && activeOpener?.tabId === activeTabId
        ? { ...activeOpener.page }
        : null;

      this.tabs = this.tabs.filter(tab => !removedTabIds.has(tab.id));
      for (const tabId of removedTabIds) Reflect.deleteProperty(this.histories, tabId);
      for (const tab of this.tabs) {
        if (tab.workspaceSlug !== workspaceSlug) continue;
        const history = this.histories[tab.id];
        if (history?.entries.some(page => page.memoSlug === memoSlug)) {
          this.histories[tab.id] = withoutMemoFromHistory(history, memoSlug);
        }
      }
      this.closedTabs = this.closedTabs
        .filter(item => !(
          item.tab.workspaceSlug === workspaceSlug && item.tab.memoSlug === memoSlug
        ))
        .map(item => item.tab.workspaceSlug === workspaceSlug
          ? { ...item, history: withoutMemoFromHistory(item.history, memoSlug) }
          : item)
        .filter(item => item.history.entries.length > 0);

      if (activeOpener && removedTabIds.has(activeOpener.tabId)) {
        Reflect.deleteProperty(this.activeTabOpeners, workspaceSlug);
      }
      if (wasActive) this.activeTabIds[workspaceSlug] = fallbackTab?.id ?? null;

      return removedTabs.length > 0
        ? { wasActive, fallbackTab, openerPage }
        : null;
    },

    close(workspaceSlug: string, tabId: string): CloseTabResult | null {
      const tabIndex = this.tabs.findIndex(tab => (
        tab.id === tabId && tab.workspaceSlug === workspaceSlug
      ));
      if (tabIndex < 0) return null;

      const tab = this.tabs[tabIndex];
      if (!tab) return null;
      const workspaceTabs = this.tabs.filter(item => item.workspaceSlug === workspaceSlug);
      const workspaceIndex = workspaceTabs.findIndex(item => item.id === tabId);
      const fallbackTab = workspaceTabs[workspaceIndex + 1] ?? workspaceTabs[workspaceIndex - 1] ?? null;
      const wasActive = this.activeTabIds[workspaceSlug] === tabId;
      const activeOpener = this.activeTabOpeners[workspaceSlug];
      const openerPage = wasActive && activeOpener?.tabId === tabId
        ? { ...activeOpener.page }
        : null;
      this.closedTabs.push({
        tab: { ...tab },
        history: copyHistory(resolveTabHistory(this.histories[tabId], tab)),
        workspaceIndex,
      });
      if (this.closedTabs.length > MAX_CLOSED_TABS) this.closedTabs.shift();

      this.tabs = this.tabs.filter(tab => tab.id !== tabId);
      Reflect.deleteProperty(this.histories, tabId);
      if (activeOpener?.tabId === tabId) {
        Reflect.deleteProperty(this.activeTabOpeners, workspaceSlug);
      }
      if (wasActive) this.activeTabIds[workspaceSlug] = fallbackTab?.id ?? null;

      return { wasActive, fallbackTab, openerPage };
    },

    restoreLastClosed(workspaceSlug: string) {
      const closedIndex = this.closedTabs.findLastIndex(item => (
        item.tab.workspaceSlug === workspaceSlug
      ));
      if (closedIndex < 0) return null;

      const [closed] = this.closedTabs.splice(closedIndex, 1);
      if (!closed) return null;

      const workspaceTabs = this.tabs.filter(tab => tab.workspaceSlug === workspaceSlug);
      const nextTab = workspaceTabs[closed.workspaceIndex];
      const previousTab = workspaceTabs[closed.workspaceIndex - 1];
      const insertAt = nextTab
        ? this.tabs.findIndex(tab => tab.id === nextTab.id)
        : previousTab
          ? this.tabs.findIndex(tab => tab.id === previousTab.id) + 1
          : this.tabs.length;

      this.tabs.splice(insertAt, 0, { ...closed.tab });
      this.histories[closed.tab.id] = copyHistory(closed.history);
      Reflect.deleteProperty(this.activeTabOpeners, workspaceSlug);
      this.activeTabIds[workspaceSlug] = closed.tab.id;
      return closed.tab;
    },

    reorder(
      workspaceSlug: string,
      draggedTabId: string,
      targetTabId: string,
      position: 'before' | 'after',
    ) {
      this.tabs = reorderWorkspaceTabs(
        this.tabs,
        workspaceSlug,
        draggedTabId,
        targetTabId,
        position,
      );
    },
  },

  persist: {
    key: 'monobox:tabs',
    omit: ['activeTabOpeners'],
  },
});
