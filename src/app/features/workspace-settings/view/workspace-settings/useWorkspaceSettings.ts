import { computed, ref, watch } from 'vue';

import { deleteWorkspace as executeDeleteWorkspace } from '../../resource/command/deleteWorkspace';
import { useCurrentWorkspaceReadModel } from '../../resource/read-model';

import type { useToast } from '#imports';

import { workspaceQuery } from '~/resources/workspace/queries';
import { iconKey } from '~/utils/icon';

type UseWorkspaceSettingsOptions = {
  route: {
    query: Record<string, unknown>;
  };
  router: {
    replace: (to: string) => Promise<unknown> | unknown;
  };
  toast: ReturnType<typeof useToast>;
};

export function useWorkspaceSettings(options: UseWorkspaceSettingsOptions) {
  const workspaceContextSlug = computed(() => {
    const raw = options.route.query.workspace;
    return typeof raw === 'string' ? raw : '';
  });
  const currentWorkspaceReadModel = useCurrentWorkspaceReadModel(workspaceContextSlug);
  const hasWorkspaceContext = computed(() => workspaceContextSlug.value.length > 0);

  const currentWorkspace = computed(() => {
    if (!hasWorkspaceContext.value) return null;
    const workspace = currentWorkspaceReadModel.value.data.workspace;
    if (!workspace) return null;
    return workspace.slug_name === workspaceContextSlug.value ? workspace : null;
  });

  const isWorkspaceLoading = computed(() =>
    hasWorkspaceContext.value && currentWorkspaceReadModel.value.flags.isLoading,
  );

  const activePanel = ref<'mcp-server' | 'global-shortcuts' | 'appearance' | 'storage-paths' | 'files' | 'memo-templates' | 'statuses' | 'danger-zone'>(
    hasWorkspaceContext.value ? 'memo-templates' : 'mcp-server',
  );
  const isDeleteConfirmationOpen = ref(false);

  watch(hasWorkspaceContext, (next) => {
    activePanel.value = next ? 'memo-templates' : 'mcp-server';
  });

  const openDeleteConfirmation = () => {
    isDeleteConfirmationOpen.value = true;
  };

  const closeDeleteConfirmation = () => {
    isDeleteConfirmationOpen.value = false;
  };

  const deleteWorkspace = async () => {
    const slugName = currentWorkspace.value?.slug_name;
    if (!slugName) {
      options.toast.add({
        title: 'Workspace is not selected.',
        color: 'error',
        icon: iconKey.failed,
      });
      return;
    }

    try {
      await executeDeleteWorkspace(slugName);
      options.toast.add({
        title: 'Delete successfully.',
        duration: 1000,
        icon: iconKey.success,
      });
      closeDeleteConfirmation();
      await options.router.replace('/');
    }
    catch (error) {
      console.error(error);
      options.toast.add({
        title: 'Failed to delete.',
        description: 'Please delete again.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
  };

  const loadWorkspaceSettings = async () => {
    if (!hasWorkspaceContext.value) return;
    await workspaceQuery.fetch({ workspaceSlug: workspaceContextSlug.value });
  };

  return {
    workspaceContextSlug,
    currentWorkspaceReadModel,
    hasWorkspaceContext,
    currentWorkspace,
    isWorkspaceLoading,
    activePanel,
    isDeleteConfirmationOpen,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    deleteWorkspace,
    loadWorkspaceSettings,
  };
}
