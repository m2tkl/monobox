import { ref } from 'vue';

import { useCreateWorkspaceAction } from '../action/useCreateWorkspaceAction';
import { useWorkspacesReadModel } from '../read-model';
import { useWorkspaceFormState } from '../state/useWorkspaceFormState';

export function useWorkspaceSelection() {
  const workspacesReadModel = useWorkspacesReadModel();
  const form = useWorkspaceFormState();
  const isCreateModalOpen = ref(false);
  const { execute: createWorkspace } = useCreateWorkspaceAction();

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
    createWorkspace,
    openCreateWorkspaceModal,
    closeCreateWorkspaceModal,
    resetCreateWorkspaceForm,
  };
}
