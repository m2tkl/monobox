<template>
  <AppDialog
    :open="isOpen"
    :title="dialogTitle"
    card-class="file-inspector"
    :card-ui="{ body: 'sm:p-5' }"
    @update:open="setOpen"
  >
    <LoadingSpinner v-if="isLoading" />

    <div
      v-else-if="loadError"
      class="file-inspector__message"
      role="status"
    >
      {{ loadError }}
    </div>

    <div
      v-else-if="detail"
      class="file-inspector__body"
    >
      <label class="file-inspector__field">
        <span>Name</span>
        <AppInput v-model="form.displayName" />
      </label>

      <dl class="file-inspector__metadata">
        <div>
          <dt>Type</dt>
          <dd>{{ fileTypeLabel }}</dd>
        </div>
        <div>
          <dt>Imported</dt>
          <dd>{{ formattedImportedAt }}</dd>
        </div>
        <div v-if="detail.relative_path">
          <dt>{{ detail.type === 'local_directory' ? 'Folder' : 'File' }}</dt>
          <dd>{{ detail.relative_path.split('/').at(-1) }}</dd>
        </div>
      </dl>

      <label
        v-if="detail.type === 'external_link'"
        class="file-inspector__field"
      >
        <span>URL</span>
        <AppInput v-model="form.url" />
      </label>

      <label class="file-inspector__field">
        <span>Note</span>
        <AppTextarea
          v-model="form.note"
          class="w-full"
          :rows="4"
          placeholder="Add a short note about this file"
        />
      </label>

      <section class="file-inspector__related">
        <h3>Related memos</h3>
        <p v-if="detail.related_memos.length === 0">
          No related memos.
        </p>
        <NuxtLink
          v-for="memo in detail.related_memos"
          :key="`${memo.workspace_slug_name}/${memo.memo_slug_title}`"
          :to="`/${memo.workspace_slug_name}/${memo.memo_slug_title}`"
        >
          {{ memo.title }}
        </NuxtLink>
      </section>
    </div>

    <template #footer>
      <div class="file-inspector__footer">
        <AppButton
          color="neutral"
          variant="ghost"
          @click="close"
        >
          Cancel
        </AppButton>
        <AppButton
          v-if="detail"
          :icon="iconKey.openPanel"
          color="neutral"
          variant="outline"
          :loading="isOpening"
          @click="openExternally"
        >
          Open
        </AppButton>
        <AppButton
          :loading="isSaving"
          :disabled="!canSave"
          @click="save"
        >
          Save
        </AppButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { renameManagedFile } from '../../resource/command/renameManagedFile';
import { updateExternalFileLink } from '../../resource/command/updateExternalFileLink';
import { updateManagedFileNote } from '../../resource/command/updateManagedFileNote';

import type { ManagedFileDetail } from '~/models/file';

import AppButton from '~/app/elements/AppButton.vue';
import AppInput from '~/app/elements/AppInput.vue';
import AppTextarea from '~/app/elements/AppTextarea.vue';
import AppDialog from '~/app/elements/overlays/AppDialog.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
import { command } from '~/resources/command';
import { iconKey } from '~/utils/icon';

const props = defineProps<{
  workspaceSlug: string;
}>();

const emit = defineEmits<{
  saved: [detail: ManagedFileDetail];
}>();

const toast = useToast();
const isOpen = ref(false);
const isLoading = ref(false);
const isSaving = ref(false);
const isOpening = ref(false);
const loadError = ref('');
const detail = ref<ManagedFileDetail | null>(null);
const form = reactive({
  displayName: '',
  url: '',
  note: '',
});

const dialogTitle = computed(() => {
  if (!detail.value) return 'File information';
  if (detail.value.type === 'external_link') return 'Edit shared link';
  if (detail.value.type === 'local_directory') return 'Edit folder';
  return 'Edit file';
});
const fileTypeLabel = computed(() => {
  if (detail.value?.type === 'external_link') return 'Shared link';
  if (detail.value?.type === 'local_directory') return 'Folder';
  return 'File';
});
const formattedImportedAt = computed(() => {
  if (!detail.value?.imported_at) return 'Unknown';
  const date = new Date(detail.value.imported_at);
  return Number.isNaN(date.getTime()) ? detail.value.imported_at : date.toLocaleString();
});
const canSave = computed(() => {
  if (!detail.value || isLoading.value || isSaving.value) return false;
  if (!form.displayName.trim()) return false;
  return detail.value.type !== 'external_link' || !!form.url.trim();
});

function reset() {
  detail.value = null;
  loadError.value = '';
  form.displayName = '';
  form.url = '';
  form.note = '';
}

function close() {
  isOpen.value = false;
}

function setOpen(value: boolean) {
  isOpen.value = value;
}

async function open(fileId: string) {
  reset();
  isOpen.value = true;
  isLoading.value = true;
  try {
    const fileDetail = await command.file.getFileDetail(fileId);
    detail.value = fileDetail;
    form.displayName = fileDetail.display_name;
    form.url = fileDetail.url ?? '';
    form.note = fileDetail.note ?? '';
  }
  catch {
    loadError.value = 'File information could not be loaded.';
  }
  finally {
    isLoading.value = false;
  }
}

async function openExternally() {
  if (!detail.value) return;
  isOpening.value = true;
  try {
    await command.file.openManagedFile(detail.value.id);
  }
  catch {
    toast.add({ title: 'Failed to open file.', color: 'error' });
  }
  finally {
    isOpening.value = false;
  }
}

async function save() {
  if (!detail.value || !canSave.value) return;
  isSaving.value = true;
  try {
    if (detail.value.type === 'external_link') {
      await updateExternalFileLink({
        workspaceSlug: props.workspaceSlug,
        fileId: detail.value.id,
        displayName: form.displayName.trim(),
        url: form.url.trim(),
      });
    }
    else {
      await renameManagedFile({
        workspaceSlug: props.workspaceSlug,
        fileId: detail.value.id,
        displayName: form.displayName.trim(),
      });
    }

    await updateManagedFileNote({
      workspaceSlug: props.workspaceSlug,
      fileId: detail.value.id,
      note: form.note,
    });

    const updated = await command.file.getFileDetail(detail.value.id);
    emit('saved', updated);
    toast.add({ title: 'File updated.' });
    close();
  }
  catch {
    toast.add({ title: 'Failed to update file.', color: 'error' });
  }
  finally {
    isSaving.value = false;
  }
}

defineExpose({ open });
</script>

<style scoped>
.file-inspector {
  width: min(32rem, calc(100vw - 2rem));
}

.file-inspector__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-inspector__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}

.file-inspector__metadata {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1rem;
  margin: 0;
  padding: 0.75rem;
  border: 1px solid var(--color-border-light);
  border-radius: 0.625rem;
  background: var(--color-surface-muted);
}

.file-inspector__metadata div {
  min-width: 0;
}

.file-inspector__metadata dt {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.file-inspector__metadata dd {
  overflow: hidden;
  margin: 0.125rem 0 0;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-inspector__related {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.file-inspector__related h3 {
  color: var(--color-text-primary);
  font-weight: 600;
}

.file-inspector__related p {
  color: var(--color-text-muted);
}

.file-inspector__related a {
  color: var(--color-text-primary);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.file-inspector__message {
  padding: 1rem 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.file-inspector__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
