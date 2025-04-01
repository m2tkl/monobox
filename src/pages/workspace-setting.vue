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
      <UModal v-model="isOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
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
      </UModal>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Workspace } from '~/models/workspace';

definePageMeta({
  path: '/:workspace/_setting',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const command = useCommand();

const workspace = ref<Workspace>();
workspace.value = await command.workspace.get({ slugName: route.params.workspace as string });

const { setWorkspace } = useWorkspace();
setWorkspace(workspace.value!);

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
