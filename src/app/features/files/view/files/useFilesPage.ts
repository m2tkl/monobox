import { computed, onMounted, ref, watch } from 'vue';

import { useManagedFileActions } from './useManagedFileActions';
import { useManagedFileDialogs } from './useManagedFileDialogs';
import { useManagedFilesListState } from './useManagedFilesListState';

import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

type UseFilesPageOptions = {
  route: ReturnType<typeof useRoute>;
  router: ReturnType<typeof useRouter>;
  toast: ReturnType<typeof useToast>;
};

export function useFilesPage(options: UseFilesPageOptions) {
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(options.route) || '');
  const activeTab = computed<'files' | 'inbox'>(() =>
    options.route.query.tab === 'inbox' ? 'inbox' : 'files',
  );

  const inboxPanelRef = ref<{ loadPage: () => Promise<void> } | null>(null);
  const listState = useManagedFilesListState({
    workspaceSlug,
    toast: options.toast,
  });
  const dialogs = useManagedFileDialogs({
    items: listState.items,
    memos: listState.memos,
  });
  const actions = useManagedFileActions({
    workspaceSlug,
    detailFileId: dialogs.detailFileId,
    pendingFileId: dialogs.pendingFileId,
    pendingEditFileId: dialogs.pendingEditFileId,
    selectedMemoSlug: dialogs.selectedMemoSlug,
    createForm: dialogs.createForm,
    editForm: dialogs.editForm,
    closeEditModal: dialogs.closeEditModal,
    closeLinkModal: dialogs.closeLinkModal,
    closeDetailModal: dialogs.closeDetailModal,
    openDetailModal: dialogs.openDetailModal,
    toast: options.toast,
  });

  const setActiveTab = async (tab: 'files' | 'inbox') => {
    const nextQuery = {
      ...options.route.query,
      ...(tab === 'inbox' ? { tab: 'inbox' } : { tab: undefined }),
    };
    await options.router.replace({
      path: options.route.path,
      query: nextQuery,
      hash: options.route.hash,
    });
  };

  const loadPage = async () => {
    await listState.loadPage();
    await actions.refreshDetail();
  };

  onMounted(() => {
    if (activeTab.value === 'files') {
      void listState.dispatch({ type: 'list/load-requested' });
    }
  });

  watch(activeTab, (tab) => {
    if (tab === 'files') {
      void listState.dispatch({ type: 'list/load-requested' });
    }
  });

  return {
    workspaceSlug,
    activeTab,
    inboxPanelRef,
    setActiveTab,
    ...listState,
    ...dialogs,
    ...actions,
    loadPage,
  };
}
