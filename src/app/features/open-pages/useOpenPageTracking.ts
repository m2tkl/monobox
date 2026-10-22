import { onScopeDispose, watch } from 'vue';

import {
  findActiveWorkspaceTab,
  findWorkspaceToolPage,
  getLocationAfterTabClose,
  getStandaloneWorkspaceViewPage,
  isStandaloneWorkspaceView,
  type TabPage,
} from './openPages';
import { useOpenPagesStore } from './openPagesStore';

import { useWorkspaceMemosReadModel } from '~/app/features/memo-browsing';
import { observeResourceChanges } from '~/resource-runtime/query-runtime';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const NON_MEMO_SLUGS = new Set(['__new__']);

export function useOpenPageTracking() {
  const route = useRoute();
  const openPages = useOpenPagesStore();
  const router = useRouter();
  const workspaceMemosVM = useWorkspaceMemosReadModel();
  let previousFixedWorkspaceView: TabPage | null = null;
  const stopObservingResourceChanges = observeResourceChanges(async (changes) => {
    for (const change of changes) {
      if (change.type === 'memoRenamed') {
        openPages.reconcileRenamedMemo(change.workspaceSlug, change.previousMemoSlug, change.memoSlug);
        continue;
      }
      if (change.type !== 'memoDeleted') continue;

      const result = openPages.reconcileDeletedMemo(change.workspaceSlug, change.memoSlug);
      const currentWorkspaceSlug = getEncodedWorkspaceSlugFromPath(route);
      const currentMemoSlug = getEncodedMemoSlugFromPath(route);
      if (currentWorkspaceSlug !== change.workspaceSlug || currentMemoSlug !== change.memoSlug) {
        continue;
      }

      const destination = result
        ? getLocationAfterTabClose(change.workspaceSlug, result)
        : `/${change.workspaceSlug}`;
      if (destination) await router.replace(destination);
    }
  });
  onScopeDispose(stopObservingResourceChanges);

  const syncRouteToActiveTab = (
    onlyWhenRouteMatchesActiveTab = false,
    openInOwnTab = false,
  ) => {
    const workspaceSlug = getEncodedWorkspaceSlugFromPath(route);
    const memoSlug = getEncodedMemoSlugFromPath(route);
    if (!workspaceSlug) {
      return;
    }

    const workspaceRoutePath = route.path.slice(`/${workspaceSlug}`.length);
    const workspaceToolPage = findWorkspaceToolPage(workspaceRoutePath);

    if (workspaceToolPage) {
      if (isStandaloneWorkspaceView(route, workspaceSlug)) {
        openPages.discardFixedWorkspaceViewTabs(workspaceSlug);
        return;
      }

      const activeTab = findActiveWorkspaceTab(
        openPages.tabs,
        openPages.activeTabIds,
        workspaceSlug,
      );
      if (activeTab?.routePath === workspaceToolPage.routePath) return;

      if (onlyWhenRouteMatchesActiveTab) {
        if (activeTab?.routePath !== workspaceToolPage.routePath) return;
      }

      if (openInOwnTab) {
        const tabId = openPages.openOrActivatePageTab(workspaceSlug, workspaceToolPage);
        if (previousFixedWorkspaceView) {
          openPages.setActiveTabOpener(workspaceSlug, tabId, previousFixedWorkspaceView);
        }
        return;
      }

      openPages.openInActiveTab(workspaceSlug, workspaceToolPage);
      return;
    }

    if (!memoSlug || NON_MEMO_SLUGS.has(memoSlug) || memoSlug.startsWith('_')) return;

    if (onlyWhenRouteMatchesActiveTab) {
      const activeTab = findActiveWorkspaceTab(
        openPages.tabs,
        openPages.activeTabIds,
        workspaceSlug,
      );
      if (activeTab?.memoSlug !== memoSlug || activeTab.hash !== route.hash) return;
    }

    const memo = workspaceMemosVM.value.data.items.find(item => item.slug_title === memoSlug);
    const page = {
      memoSlug,
      hash: route.hash,
      title: memo?.title ?? memoSlug,
    };
    if (openInOwnTab) {
      const tabId = openPages.openOrActivatePageTab(workspaceSlug, page);
      if (previousFixedWorkspaceView) {
        openPages.setActiveTabOpener(workspaceSlug, tabId, previousFixedWorkspaceView);
      }
      return;
    }
    openPages.openInActiveTab(workspaceSlug, page);
  };

  watch(() => route.fullPath, () => {
    const openInOwnTab = previousFixedWorkspaceView !== null;
    syncRouteToActiveTab(false, openInOwnTab);

    const workspaceSlug = getEncodedWorkspaceSlugFromPath(route);
    previousFixedWorkspaceView = workspaceSlug
      ? getStandaloneWorkspaceViewPage(route, workspaceSlug)
      : null;
  }, { immediate: true });
  watch(
    () => workspaceMemosVM.value.data.items,
    () => syncRouteToActiveTab(true),
  );
}
