import { ref } from 'vue';

import { useWorkspaceFormState } from './useWorkspaceFormState';
import { createWorkspace } from '../../resource/command/createWorkspace';
import { useWorkspacesReadModel } from '../../resource/read-model';

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
