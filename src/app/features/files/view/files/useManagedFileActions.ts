import { ref } from 'vue';

import { createExternalFileLink } from '../../resource/command/createExternalFileLink';
import { deleteManagedFile } from '../../resource/command/deleteManagedFile';
import { linkManagedFileToMemo } from '../../resource/command/linkManagedFileToMemo';
import { openManagedFile as executeOpenManagedFile } from '../../resource/command/openManagedFile';
import { renameManagedFile } from '../../resource/command/renameManagedFile';
import { updateExternalFileLink } from '../../resource/command/updateExternalFileLink';
import { updateManagedFileNote } from '../../resource/command/updateManagedFileNote';

import type { ComputedRef, Ref } from 'vue';
import type { ManagedFileDetail } from '~/models/file';

import { command } from '~/resources/command';
import { handleError } from '~/utils/error';

type UseManagedFileActionsOptions = {
  workspaceSlug: ComputedRef<string>;
  pendingFileId: Ref<string>;
  pendingEditFileId: Ref<string>;
  selectedMemoSlug: Ref<string>;
  createForm: Ref<{ displayName: string; url: string }>;
  editForm: Ref<{ displayName: string; url: string; note: string; type: 'local_file' | 'external_link' | '' }>;
  closeEditModal: () => void;
  closeLinkModal: () => void;
  toast: ReturnType<typeof useToast>;
};

export function useManagedFileActions(options: UseManagedFileActionsOptions) {
  const isSubmitting = ref(false);
  const isEditDetailLoading = ref(false);
  const editDetail = ref<ManagedFileDetail | null>(null);

  const openManagedFile = async (fileId: string) => {
    try {
      await executeOpenManagedFile(fileId);
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to open file.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const createManagedLink = async () => {
    isSubmitting.value = true;
    try {
      await createExternalFileLink({
        workspaceSlug: options.workspaceSlug.value,
        displayName: options.createForm.value.displayName,
        url: options.createForm.value.url,
      });
      options.createForm.value.displayName = '';
      options.createForm.value.url = '';
      options.toast.add({ title: 'Shared link added.' });
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to add shared link.',
        description: appError.message,
        color: 'error',
      });
      return;
    }
    finally {
      isSubmitting.value = false;
    }
  };

  const saveEdit = async () => {
    if (!options.pendingEditFileId.value) {
      return;
    }

    isSubmitting.value = true;
    try {
      const isExternalLink = options.editForm.value.type === 'external_link';
      if (isExternalLink) {
        await updateExternalFileLink({
          workspaceSlug: options.workspaceSlug.value,
          fileId: options.pendingEditFileId.value,
          displayName: options.editForm.value.displayName,
          url: options.editForm.value.url,
        });
      }
      else {
        await renameManagedFile({
          workspaceSlug: options.workspaceSlug.value,
          fileId: options.pendingEditFileId.value,
          displayName: options.editForm.value.displayName,
        });
      }

      await updateManagedFileNote({
        workspaceSlug: options.workspaceSlug.value,
        fileId: options.pendingEditFileId.value,
        note: options.editForm.value.note,
      });

      options.closeEditModal();
      options.toast.add({ title: isExternalLink ? 'Link updated.' : 'File updated.' });
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to update file.',
        description: appError.message,
        color: 'error',
      });
    }
    finally {
      isSubmitting.value = false;
    }
  };

  const linkToMemo = async () => {
    if (!options.pendingFileId.value || !options.selectedMemoSlug.value) {
      return;
    }

    isSubmitting.value = true;
    try {
      await linkManagedFileToMemo({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.selectedMemoSlug.value,
        fileId: options.pendingFileId.value,
      });
      options.toast.add({ title: 'Linked to memo.' });
      options.closeLinkModal();
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to link to memo.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const loadEditTarget = async (fileId: string) => {
    isEditDetailLoading.value = true;
    editDetail.value = null;
    try {
      const fileDetail = await command.file.getFileDetail(fileId);
      editDetail.value = fileDetail;
      options.editForm.value.displayName = fileDetail.display_name;
      options.editForm.value.url = fileDetail.url ?? '';
      options.editForm.value.note = fileDetail.note ?? '';
      options.editForm.value.type = fileDetail.type;
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to load file details.',
        description: appError.message,
        color: 'error',
      });
    }
    finally {
      isEditDetailLoading.value = false;
    }
  };

  const removeRecord = async (fileId: string) => {
    isSubmitting.value = true;
    try {
      await deleteManagedFile({
        workspaceSlug: options.workspaceSlug.value,
        fileId,
      });
      if (editDetail.value?.id === fileId) {
        options.closeEditModal();
      }
      options.toast.add({ title: 'File removed.' });
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to remove file.',
        description: appError.message,
        color: 'error',
      });
    }
    finally {
      isSubmitting.value = false;
    }
  };

  return {
    isSubmitting,
    isEditDetailLoading,
    editDetail,
    openManagedFile,
    createManagedLink,
    saveEdit,
    loadEditTarget,
    linkToMemo,
    removeRecord,
  };
}
