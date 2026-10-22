export type OpenTab = {
  id: string;
  workspaceSlug: string;
  memoSlug: string | null;
  routePath?: string;
  hash: string;
  title: string;
  createdAt: number;
  isPinned?: boolean;
};

export type TabPage = {
  memoSlug: string | null;
  routePath?: string;
  hash?: string;
  title: string;
};

export type TabHistory = {
  entries: TabPage[];
  currentIndex: number;
};

export type ClosedTab = {
  tab: OpenTab;
  history: TabHistory;
  workspaceIndex: number;
};

export type CloseTabResult = {
  wasActive: boolean;
  fallbackTab: OpenTab | null;
  openerPage: TabPage | null;
};

export const NEW_TAB_PAGE: TabPage = {
  memoSlug: null,
  routePath: '/_new-tab',
  hash: '',
  title: 'New tab',
};

export const BOOKMARKS_PAGE: TabPage = {
  memoSlug: null,
  routePath: '/_bookmarks',
  hash: '',
  title: 'Bookmarks',
};

export const FOCUS_PAGE: TabPage = {
  memoSlug: null,
  routePath: '/_focus',
  hash: '',
  title: 'Focus',
};

export const KANBAN_PAGE: TabPage = {
  memoSlug: null,
  routePath: '/_kanban',
  hash: '',
  title: 'Kanban',
};

export const FILES_PAGE: TabPage = {
  memoSlug: null,
  routePath: '/_files',
  hash: '',
  title: 'Files',
};

export const CALENDAR_PAGE: TabPage = {
  memoSlug: null,
  routePath: '/_calendar',
  hash: '',
  title: 'Calendar',
};

export const FIXED_WORKSPACE_VIEW_PATHS = new Set([
  FOCUS_PAGE.routePath,
  BOOKMARKS_PAGE.routePath,
  KANBAN_PAGE.routePath,
  FILES_PAGE.routePath,
  CALENDAR_PAGE.routePath,
]);

export function isFixedWorkspaceViewPath(routePath: string | undefined) {
  return !!routePath && FIXED_WORKSPACE_VIEW_PATHS.has(routePath);
}

export const WORKSPACE_TOOL_PAGES = [
  { routePath: '/_new-tab', title: 'New tab' },
  { routePath: FOCUS_PAGE.routePath, title: FOCUS_PAGE.title },
  { routePath: BOOKMARKS_PAGE.routePath, title: BOOKMARKS_PAGE.title },
  { routePath: KANBAN_PAGE.routePath, title: KANBAN_PAGE.title },
  { routePath: '/_search', title: 'Full search' },
  { routePath: '/_inbox', title: 'Inbox' },
  { routePath: FILES_PAGE.routePath, title: FILES_PAGE.title },
  { routePath: CALENDAR_PAGE.routePath, title: CALENDAR_PAGE.title },
] as const;

export function findWorkspaceToolPage(routePath: string): TabPage | null {
  if (/^\/_files\/[^/]+$/.test(routePath)) {
    return { memoSlug: null, routePath, title: 'File' };
  }
  const page = WORKSPACE_TOOL_PAGES.find(item => item.routePath === routePath);
  return page ? { memoSlug: null, ...page } : null;
}

export function findActiveWorkspaceTab(
  tabs: OpenTab[],
  activeTabIds: Record<string, string | null>,
  workspaceSlug: string,
): OpenTab | null {
  const activeTabId = activeTabIds[workspaceSlug];
  return tabs.find(tab => (
    tab.id === activeTabId && tab.workspaceSlug === workspaceSlug
  )) ?? null;
}

export function getStandaloneWorkspaceViewUrl(
  route: { path: string; query: { bookmarked?: unknown } },
  workspaceSlug: string,
): string | null {
  if (route.path === `/${workspaceSlug}/_focus`) return 'monobox://focus';
  if (route.path === `/${workspaceSlug}/_kanban`) return 'monobox://kanban';
  if (route.path === `/${workspaceSlug}/_bookmarks`) return 'monobox://bookmarks';
  if (route.path === `/${workspaceSlug}/_files`) return 'monobox://files';
  if (route.path === `/${workspaceSlug}/_calendar`) return 'monobox://calendar';
  if (route.path !== `/${workspaceSlug}`) return null;

  const bookmarked = route.query.bookmarked;
  const isLegacyBookmarkRoute = Array.isArray(bookmarked) ? bookmarked[0] === 'true' : bookmarked === 'true';
  return isLegacyBookmarkRoute ? 'monobox://bookmarks' : null;
}

export function getStandaloneWorkspaceViewPage(
  route: { path: string; query: { bookmarked?: unknown } },
  workspaceSlug: string,
): TabPage | null {
  const url = getStandaloneWorkspaceViewUrl(route, workspaceSlug);
  if (url === 'monobox://focus') return FOCUS_PAGE;
  if (url === 'monobox://kanban') return KANBAN_PAGE;
  if (url === 'monobox://bookmarks') return BOOKMARKS_PAGE;
  if (url === 'monobox://files') return FILES_PAGE;
  if (url === 'monobox://calendar') return CALENDAR_PAGE;
  return null;
}

export function isStandaloneWorkspaceView(
  route: { path: string; query: { bookmarked?: unknown } },
  workspaceSlug: string,
) {
  return getStandaloneWorkspaceViewUrl(route, workspaceSlug) !== null;
}

function normalizeTabPage(page: TabPage): TabPage {
  return {
    memoSlug: page.memoSlug,
    routePath: page.routePath ?? '',
    hash: page.hash ?? '',
    title: page.title,
  };
}

function isSameTabPage(first: TabPage, second: TabPage) {
  return first.memoSlug === second.memoSlug
    && (first.routePath ?? '') === (second.routePath ?? '')
    && (first.hash ?? '') === (second.hash ?? '');
}

export function createTabHistory(initialPage: TabPage = NEW_TAB_PAGE): TabHistory {
  return {
    entries: [normalizeTabPage(initialPage)],
    currentIndex: 0,
  };
}

export function currentHistoryPage(history: TabHistory): TabPage | null {
  return history.entries[history.currentIndex] ?? null;
}

export function pushTabHistory(history: TabHistory, page: TabPage): TabHistory {
  const normalizedPage = normalizeTabPage(page);
  const currentPage = currentHistoryPage(history);

  if (currentPage && isSameTabPage(currentPage, normalizedPage)) {
    return {
      entries: history.entries.map((entry, index) => (
        index === history.currentIndex ? normalizedPage : entry
      )),
      currentIndex: history.currentIndex,
    };
  }

  const entries = history.entries.slice(0, history.currentIndex + 1);
  entries.push(normalizedPage);
  return {
    entries,
    currentIndex: entries.length - 1,
  };
}

export function moveTabHistory(history: TabHistory, offset: -1 | 1): TabHistory {
  if (history.entries.length === 0) return history;
  const currentIndex = Math.max(
    0,
    Math.min(history.entries.length - 1, history.currentIndex + offset),
  );
  return currentIndex === history.currentIndex
    ? history
    : { ...history, currentIndex };
}

export function replaceTabPage(tabs: OpenTab[], tabId: string, page: TabPage): OpenTab[] {
  return tabs.map(tab => tab.id === tabId
    ? {
        ...tab,
        memoSlug: page.memoSlug,
        routePath: page.routePath ?? '',
        hash: page.hash ?? '',
        title: page.title,
      }
    : tab);
}

export function getTabPageLocation(workspaceSlug: string, page: TabPage): string {
  if (page.routePath) return `/${workspaceSlug}${page.routePath}`;
  if (!page.memoSlug) return `/${workspaceSlug}${NEW_TAB_PAGE.routePath}`;
  return `/${workspaceSlug}/${page.memoSlug}${page.hash ?? ''}`;
}

export function getLocationAfterTabClose(
  workspaceSlug: string,
  result: CloseTabResult,
): string | null {
  if (!result.wasActive) return null;
  if (result.openerPage) return getTabPageLocation(workspaceSlug, result.openerPage);
  if (result.fallbackTab) return getTabPageLocation(workspaceSlug, result.fallbackTab);
  return `/${workspaceSlug}`;
}

export function createFileTabPage(fileId: string, title: string): TabPage {
  return {
    memoSlug: null,
    routePath: `/_files/${encodeURIComponent(fileId)}`,
    title,
  };
}

export function resetTabPage(tabs: OpenTab[], tabId: string): OpenTab[] {
  return replaceTabPage(tabs, tabId, NEW_TAB_PAGE);
}

export function reorderWorkspaceTabs(
  tabs: OpenTab[],
  workspaceSlug: string,
  draggedTabId: string,
  targetTabId: string,
  position: 'before' | 'after',
): OpenTab[] {
  if (draggedTabId === targetTabId) return tabs;

  const workspaceTabs = tabs.filter(tab => tab.workspaceSlug === workspaceSlug);
  const draggedIndex = workspaceTabs.findIndex(tab => tab.id === draggedTabId);
  if (draggedIndex === -1 || !workspaceTabs.some(tab => tab.id === targetTabId)) return tabs;

  const [draggedTab] = workspaceTabs.splice(draggedIndex, 1);
  if (!draggedTab) return tabs;

  const targetIndex = workspaceTabs.findIndex(tab => tab.id === targetTabId);
  workspaceTabs.splice(position === 'before' ? targetIndex : targetIndex + 1, 0, draggedTab);

  let workspaceIndex = 0;
  return tabs.map((tab) => {
    if (tab.workspaceSlug !== workspaceSlug) return tab;
    const replacement = workspaceTabs[workspaceIndex];
    workspaceIndex += 1;
    return replacement ?? tab;
  });
}
