import { ref } from 'vue';

import { useWorkspacesReadModel } from './read-model';

import { useCreateWorkspaceAction } from '~/features/workspace/actions/useCreateWorkspaceAction';
import { useWorkspaceFormState } from '~/features/workspace/forms/useWorkspaceFormState';

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
