<template>
  <UCard class="card-themed">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h4
          class="text-base font-semibold"
          style="color: var(--color-text-primary)"
        >
          Templates
        </h4>
        <AppButton
          class="template-primary-button"
          size="sm"
          color="primary"
          :icon="iconKey.add"
          :loading="isCreating"
          @click="createTemplate"
        >
          New template
        </AppButton>
      </div>
    </template>

    <div
      v-if="isLoading"
      class="py-4"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="templates.length === 0"
      class="text-sm"
      style="color: var(--color-text-muted)"
    >
      No templates yet.
    </div>

    <div
      v-else
      class="flex flex-col gap-2"
    >
      <div
        v-for="template in templates"
        :key="template.id"
        class="template-row flex items-center justify-between gap-3 rounded-lg px-3 py-2"
      >
        <div class="min-w-0">
          <div class="truncate font-medium">
            {{ template.name }}
            <UBadge
              v-if="template.is_default"
              class="template-default-badge ml-2 align-middle"
              size="sm"
            >
              Default
            </UBadge>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <AppButton
            class="template-soft-button"
            size="xs"
            color="neutral"
            variant="ghost"
            :loading="defaultingSlug === template.slug_name"
            @click="toggleDefaultTemplate(template)"
          >
            {{ template.is_default ? 'Unset default' : 'Set default' }}
          </AppButton>
          <AppButton
            class="template-outline-button"
            size="xs"
            color="neutral"
            variant="ghost"
            :icon="iconKey.edit"
            @click="editTemplate(template.slug_name)"
          >
            Edit
          </AppButton>
          <AppButton
            class="template-delete-button"
            size="xs"
            color="error"
            variant="ghost"
            :icon="iconKey.trash"
            square
            aria-label="Delete template"
            :loading="deletingSlug === template.slug_name"
            @click="openDeleteConfirmation(template)"
          />
        </div>
      </div>
    </div>
  </UCard>

  <ConfirmModal
    v-model:open="isDeleteConfirmationOpen"
    title="Delete template?"
    description="This template will be removed permanently."
    confirm-label="Delete"
    :loading="deletingSlug === pendingDeleteTemplateSlug"
    @confirm="confirmDeleteTemplate"
  />

  <MemoTemplateEditorDialog
    v-if="editingTemplateSlug"
    :key="editingTemplateSlug"
    :open="isTemplateEditorOpen"
    :workspace-slug="workspaceSlug"
    :template-slug="editingTemplateSlug"
    :focus-title="shouldFocusTemplateTitle"
    @update:open="handleTemplateEditorOpenChange"
    @saved="handleTemplateEditorSaved"
  />
</template>

<script setup lang="ts">
import MemoTemplateEditorDialog from './MemoTemplateEditorDialog.vue';
import {
  createMemoTemplate,
} from '../../resource/command/createMemoTemplate';
import { deleteMemoTemplate } from '../../resource/command/deleteMemoTemplate';
import { toggleDefaultMemoTemplate } from '../../resource/command/toggleDefaultMemoTemplate';

import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import ConfirmModal from '~/app/elements/overlays/ConfirmModal.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceMemoTemplatesQuery } from '~/resources/memo-template/queries';
import { iconKey } from '~/utils/icon';

const props = defineProps<{
  workspaceSlug: string;
}>();
const toast = useToast();

const isCreating = ref(false);
const deletingSlug = ref<string>();
const defaultingSlug = ref<string>();
const isDeleteConfirmationOpen = ref(false);
const pendingDeleteTemplateSlug = ref<string>();
const editingTemplateSlug = ref<string>();
const isTemplateEditorOpen = ref(false);
const shouldFocusTemplateTitle = ref(false);

const { snapshot: templatesSnapshot } = useQuery(workspaceMemoTemplatesQuery, {
  workspaceSlug: computed(() => props.workspaceSlug),
});
const templates = computed<MemoTemplateIndexItem[]>(() => templatesSnapshot.value.current ?? []);
const isLoading = computed(() => templatesSnapshot.value.status === 'loading' && templatesSnapshot.value.current === null);

async function createTemplate() {
  isCreating.value = true;
  try {
    const created = await createMemoTemplate({
      workspaceSlug: props.workspaceSlug,
      existingTemplates: templates.value,
    });

    editingTemplateSlug.value = created.slug_name;
    shouldFocusTemplateTitle.value = true;
    isTemplateEditorOpen.value = true;
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to create template',
      description: 'Please try again',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isCreating.value = false;
  }
}

async function deleteTemplate(templateSlugName: string) {
  deletingSlug.value = templateSlugName;
  try {
    await deleteMemoTemplate({
      workspaceSlug: props.workspaceSlug,
      templateSlug: templateSlugName,
    });
    toast.add({
      title: 'Template deleted',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to delete template',
      description: 'Please try again',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    deletingSlug.value = undefined;
  }
}

function openDeleteConfirmation(template: MemoTemplateIndexItem) {
  pendingDeleteTemplateSlug.value = template.slug_name;
  isDeleteConfirmationOpen.value = true;
}

async function confirmDeleteTemplate() {
  const templateSlugName = pendingDeleteTemplateSlug.value;
  if (!templateSlugName) {
    isDeleteConfirmationOpen.value = false;
    return;
  }

  await deleteTemplate(templateSlugName);
  isDeleteConfirmationOpen.value = false;
  pendingDeleteTemplateSlug.value = undefined;
}

async function toggleDefaultTemplate(template: MemoTemplateIndexItem) {
  defaultingSlug.value = template.slug_name;
  try {
    await toggleDefaultMemoTemplate({
      workspaceSlug: props.workspaceSlug,
      template,
    });
    toast.add({
      title: template.is_default ? 'Default template cleared' : 'Default template updated',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to update default template',
      description: 'Please try again',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    defaultingSlug.value = undefined;
  }
}

function editTemplate(templateSlugName: string) {
  editingTemplateSlug.value = templateSlugName;
  shouldFocusTemplateTitle.value = false;
  isTemplateEditorOpen.value = true;
}

function handleTemplateEditorSaved(savedSlug: string) {
  editingTemplateSlug.value = savedSlug;
  shouldFocusTemplateTitle.value = false;
}

function handleTemplateEditorOpenChange(next: boolean) {
  isTemplateEditorOpen.value = next;
  if (!next) {
    editingTemplateSlug.value = undefined;
    shouldFocusTemplateTitle.value = false;
  }
}
</script>

<style scoped>
.card-themed {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border-light);
}

.template-row {
  border: 1px solid color-mix(in srgb, var(--color-border-light) 45%, transparent);
}

:deep(.template-primary-button) {
  background-color: var(--color-primary);
  color: #fff;
}

:deep(.template-primary-button:hover) {
  background-color: var(--color-primary-hover);
}

:deep(.template-soft-button) {
  background-color: color-mix(in srgb, var(--color-surface-elevated) 88%, var(--color-background));
  color: var(--color-text-primary);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 72%, transparent);
  box-shadow: none;
}

:deep(.template-soft-button:hover) {
  background-color: var(--color-surface-hover);
}

:deep(.template-outline-button) {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 72%, transparent);
  box-shadow: none;
}

:deep(.template-outline-button:hover) {
  background-color: var(--color-surface-hover);
}

:deep(.template-delete-button) {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
}

:deep(.template-delete-button:hover) {
  background-color: var(--color-surface-hover);
  border-color: color-mix(in srgb, var(--color-border-light) 72%, transparent);
  color: var(--color-text-primary);
}

.dark :deep(.template-soft-button),
.dark :deep(.template-outline-button) {
  border-color: var(--color-border-light);
}

.dark :deep(.template-soft-button) {
  background-color: var(--color-surface);
}

:deep(.template-default-badge) {
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
}
</style>
