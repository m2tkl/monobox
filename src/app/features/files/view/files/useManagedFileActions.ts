import { computed, ref, watch } from 'vue';

import { createExternalFileLink } from '../../resource/command/createExternalFileLink';
import { deleteManagedFile } from '../../resource/command/deleteManagedFile';
import { linkManagedFileToMemo } from '../../resource/command/linkManagedFileToMemo';
import { openManagedFile as executeOpenManagedFile } from '../../resource/command/openManagedFile';
import { renameManagedFile } from '../../resource/command/renameManagedFile';
import { updateManagedFileNote } from '../../resource/command/updateManagedFileNote';
import { useManagedFileDetailReadModel } from '../../resource/read-model';

import type { ComputedRef, Ref } from 'vue';

import { managedFileDetailQuery } from '~/resources/file/queries';
import { handleError } from '~/utils/error';

type UseManagedFileActionsOptions = {
  workspaceSlug: ComputedRef<string>;
  detailFileId: Ref<string>;
  pendingFileId: Ref<string>;
  pendingEditFileId: Ref<string>;
  selectedMemoSlug: Ref<string>;
  createForm: Ref<{ displayName: string; url: string }>;
  editForm: Ref<{ displayName: string }>;
  closeEditModal: () => void;
  closeLinkModal: () => void;
  closeDetailModal: () => void;
  openDetailModal: (fileId: string) => void;
  toast: ReturnType<typeof useToast>;
};

export function useManagedFileActions(options: UseManagedFileActionsOptions) {
  const isSubmitting = ref(false);
  const detailReadModel = useManagedFileDetailReadModel(
    options.workspaceSlug,
    computed(() => options.detailFileId.value || ''),
  );

  const detail = computed(() => detailReadModel.value.data.detail);
  const isDetailLoading = computed(() => detailReadModel.value.flags.isLoading);
  const detailNoteDraft = ref('');
  const hasDetailNoteChanges = computed(() =>
    detailNoteDraft.value.trim() !== (detail.value?.note ?? ''),
  );

  watch(
    () => [options.detailFileId.value, detail.value?.note ?? ''] as const,
    ([fileId, note]) => {
      detailNoteDraft.value = fileId ? note : '';
    },
    { immediate: true },
  );

  const refreshDetail = async () => {
    if (!options.detailFileId.value) {
      return;
    }

    await managedFileDetailQuery.fetch({
      workspaceSlug: options.workspaceSlug.value,
      fileId: options.detailFileId.value,
    });
  };

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

  const saveDisplayName = async () => {
    if (!options.pendingEditFileId.value) {
      return;
    }

    isSubmitting.value = true;
    try {
      await renameManagedFile({
        workspaceSlug: options.workspaceSlug.value,
        fileId: options.pendingEditFileId.value,
        displayName: options.editForm.value.displayName,
      });
      options.closeEditModal();
      options.toast.add({ title: 'Name updated.' });
      await refreshDetail();
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to update name.',
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
      options.toast.add({ title: 'Linked to note.' });
      options.closeLinkModal();
      await refreshDetail();
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to link to note.',
        description: appError.message,
        color: 'error',
      });
    }
    finally {
      isSubmitting.value = false;
    }
  };

  const showDetail = async (fileId: string) => {
    try {
      await managedFileDetailQuery.fetch({
        workspaceSlug: options.workspaceSlug.value,
        fileId,
      });
      options.openDetailModal(fileId);
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to load details.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const saveDetailNote = async () => {
    if (!options.detailFileId.value || !hasDetailNoteChanges.value) {
      return;
    }

    isSubmitting.value = true;
    try {
      await updateManagedFileNote({
        workspaceSlug: options.workspaceSlug.value,
        fileId: options.detailFileId.value,
        note: detailNoteDraft.value,
      });
      options.toast.add({ title: 'Memo updated.' });
      await refreshDetail();
    }
    catch (error) {
      const appError = handleError(error);
      options.toast.add({
        title: 'Failed to update memo.',
        description: appError.message,
        color: 'error',
      });
    }
    finally {
      isSubmitting.value = false;
    }
  };

  const removeRecord = async (fileId: string) => {
    isSubmitting.value = true;
    try {
      await deleteManagedFile({
        workspaceSlug: options.workspaceSlug.value,
        fileId,
      });
      if (options.detailFileId.value === fileId) {
        options.closeDetailModal();
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
    detail,
    isDetailLoading,
    detailNoteDraft,
    hasDetailNoteChanges,
    refreshDetail,
    openManagedFile,
    createManagedLink,
    saveDisplayName,
    linkToMemo,
    showDetail,
    saveDetailNote,
    removeRecord,
  };
}
