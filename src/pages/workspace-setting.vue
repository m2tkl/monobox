<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="py-4">
        <UContainer>
          <UCard>
            <template #header>
              <h2 class="text-lg font-bold text-gray-600">
                Workspace setting
              </h2>
            </template>
            <p>
              🚧 Under construction...
            </p>
          </UCard>

          <UCard class="mt-6">
            <template #header>
              <h2 class="text-lg font-bold text-gray-600">
                Danger zone
              </h2>
            </template>
            <UButton
              color="error"
              @click="openDeleteConfirmation"
            >
              Delete this workspace
            </UButton>
          </UCard>
        </UContainer>
      </div>
    </template>

    <template #actions>
      <!-- Delete workspace confirmation modal -->
      <UModal v-model:open="isOpen">
        <template #content>
          <UCard>
            <div class="h-24">
              Once you delete a workspace, there is no going back. Please be certain.
            </div>

            <template #footer>
              <div class="h-8">
                <UButton
                  form="create-workspace-form"
                  type="submit"
                  color="error"
                  @click="_deleteWorkspace"
                >
                  Delete
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  path: '/:workspace/_setting',
});

const router = useRouter();
const toast = useToast();
const command = useCommand();
const store = useWorkspaceStore();

const workspace = computed(() => store.workspace);

const isOpen = ref(false);
const openDeleteConfirmation = () => {
  isOpen.value = true;
};

const _deleteWorkspace = async () => {
  try {
    await command.workspace.delete({ slugName: workspace.value!.slug_name });

    toast.add({
      title: 'Delete successfully.',
      duration: 1000,
      icon: iconKey.success,
    });

    emitEvent('workspace/deleted', undefined);
    router.replace('/');
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to delete.',
      description: 'Please delete again.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};
</script>
