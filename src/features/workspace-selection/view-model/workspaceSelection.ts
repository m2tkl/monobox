import { ref } from 'vue';

import { createWorkspace } from '../action/createWorkspace';
import { useWorkspacesReadModel } from '../read-model';
import { useWorkspaceFormState } from '../state/useWorkspaceFormState';

export function useWorkspaceSelection() {
  const workspacesReadModel = useWorkspacesReadModel();
  const form = useWorkspaceFormState();
  const isCreateModalOpen = ref(false);
  const { runTask: executeCreateWorkspace, isLoading, error } = useAsyncTask(createWorkspace);

  const openCreateWorkspaceModal = () => {
    isCreateModalOpen.value = true;
  };

  const closeCreateWorkspaceModal = () => {
    isCreateModalOpen.value = false;
  };

  const resetCreateWorkspaceForm = () => {
    form.reset();
    closeCreateWorkspaceModal();
  };

  return {
    workspacesReadModel,
    form,
    isCreateModalOpen,
    createWorkspace: executeCreateWorkspace,
    isCreatingWorkspace: isLoading,
    createWorkspaceError: error,
    openCreateWorkspaceModal,
    closeCreateWorkspaceModal,
    resetCreateWorkspaceForm,
  };
}
