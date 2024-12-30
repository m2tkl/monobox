<template>
  <div class="py-4">
    <UContainer>
      <UCard>
        <template #header>
          <h2 class="text-lg font-bold text-gray-600">Workspace setting</h2>
        </template>
        <p>
          🚧 Under construction...
        </p>
      </UCard>

      <UCard class="mt-6">
        <template #header>
          <h2 class="text-lg font-bold text-gray-600">Danger zone</h2>
        </template>
        <UButton color="red" @click="openDeleteConfirmation">Delete this workspace</UButton>
      </UCard>
    </UContainer>

    <!-- Delete workspace confirmation modal -->
    <UModal v-model="isOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <div class="h-24">
          Once you delete a workspace, there is no going back. Please be certain.
        </div>

        <template #footer>
          <div class="h-8">
            <UButton form="create-workspace-form" type="submit" color="red" @click="_deleteWorkspace">
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { getWorkspace, deleteWorkspace } from "~/domain/workspace"
import type { Workspace } from "~/models/workspace"

const route = useRoute()
const router = useRouter()

const toast = useToast();

const workspace = ref<Workspace>()
workspace.value = await getWorkspace({ slugName: route.params.workspace as string })

const { setWorkspace } = useWorkspace()
setWorkspace(workspace.value!)

const isOpen = ref(false)
const openDeleteConfirmation = () => {
  isOpen.value = true
}

const _deleteWorkspace = async () => {
  try {
    await deleteWorkspace({slugName: workspace.value!.slug_name})

    toast.add({
      title: "Delete successfully.",
      timeout: 1000,
      icon: "i-heroicons-check-circle",
    });
    router.replace("/")
  } catch (error) {
    console.error(error)
    toast.add({
      title: "Failed to delete.",
      description: "Please delete again.",
      color: "red",
      icon: "i-heroicons-exclamation-triangle"
    })
  }
}
</script>
