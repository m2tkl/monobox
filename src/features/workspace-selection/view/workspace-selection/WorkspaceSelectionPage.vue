<template>
  <NuxtLayout name="workspace-entry">
    <div>
      <UContainer>
        <div>
          <div class="flex items-center justify-between space-x-3 pb-4 pt-2">
            <h2
              class="pl-1 text-2xl font-bold"
              style="color: var(--color-text-primary)"
            >
              Workspace
            </h2>
            <div class="flex items-center gap-2">
              <UButton
                variant="ghost"
                :style="{ color: 'var(--color-text-primary)' }"
                @click="goToSettings"
              >
                Settings
              </UButton>
              <UButton
                style="background-color: var(--color-primary); color: white;"
                @click="openNewWorkspaceModal"
              >
                New
              </UButton>
            </div>
          </div>

          <div v-if="!workspacesReadModel.flags.isLoading">
            <div
              v-if="workspacesReadModel.data.items.length === 0"
              class="flex items-center justify-center py-16 text-center"
              style="color: var(--color-text-secondary)"
            >
              No workspace
            </div>
            <div v-else>
              <ul
                class="rounded-md border workspace-list"
                style="border-color: var(--color-border-muted);"
              >
                <li
                  v-for="workspace in workspacesReadModel.data.items"
                  :key="workspace.id"
                  class="workspace-item transition-colors duration-200"
                >
                  <NuxtLink :to="`/${workspace.slug_name}`">
                    <div class="flex items-center justify-between px-4 py-2 hover:bg-[var(--color-surface-hover)]">
                      <span
                        class="font-bold"
                        style="color: var(--color-text-primary)"
                      >
                        {{ workspace.name }}
                      </span>
                    </div>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </UContainer>

      <UModal
        v-model:open="isCreateModalOpen"
        title="Create new workspace"
      >
        <template #body>
          <div class="h-24">
            <UForm
              id="create-workspace-form"
              :validate="form.validate"
              :state="form.state"
              class="space-y-4"
              @submit="onSubmit"
            >
              <UFormField
                label="Name"
                name="name"
              >
                <UInput
                  v-model="form.state.name"
                  class="w-full"
                />
              </UFormField>
            </UForm>
          </div>
        </template>

        <template #footer>
          <div class="h-8">
            <UButton
              form="create-workspace-form"
              type="submit"
              :loading="isCreatingWorkspace"
              style="background-color: var(--color-primary); color: white;"
            >
              Create
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useWorkspaceSelection } from './useWorkspaceSelection';

import { workspaceCollectionQuery } from '~/resources/workspace/queries';
import { iconKey } from '~/utils/icon';

const toast = useToast();
const router = useRouter();
const {
  workspacesReadModel,
  form,
  isCreateModalOpen,
  createWorkspace,
  isCreatingWorkspace,
  openCreateWorkspaceModal: openNewWorkspaceModal,
  resetCreateWorkspaceForm,
} = useWorkspaceSelection();

await usePageLoader(async () => {
  await workspaceCollectionQuery.fetch({});
});

const goToSettings = async () => {
  await router.push('/_setting');
};

const onSubmit = async () => {
  const validatedState = form.getValidatedState();
  if (!validatedState) {
    return;
  }

  const result = await createWorkspace({ name: validatedState.name });

  if (result.ok) {
    toast.add({
      title: `Workspace ${result.data.name} created successfully!`,
      duration: 1000,
      icon: iconKey.success,
    });

    resetCreateWorkspaceForm();
  }
  else {
    toast.add({
      title: 'Failed to create.',
      description: 'Please create again.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};
</script>

<style scoped>
.workspace-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border-light);
}
</style>
