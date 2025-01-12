<template>
  <div>
    <UContainer>
      <div>
        <!-- Project collection header -->
        <div class="flex justify-between pt-2 pb-4 space-x-3 items-center">
          <h2 class="pl-1 font-bold text-gray-600 text-2xl">Workspace</h2>
          <UButton color="indigo" class="bg-slate-600" @click="openNewWorkspaceModal">New</UButton>
        </div>

        <!-- Project collection -->
        <div v-if="!workspaces || workspaces && workspaces.length === 0">No workspace</div>
        <div v-else>
          <ul class="border border-gray-400 divide-y divide-gray-400 rounded-md">
            <li v-for="workspace in workspaces" class="hover:bg-slate-300">
              <NuxtLink :to="`/${workspace.slug_name}`">
                <div class="px-4 py-2 flex justify-between items-center">
                  <span class="font-bold text-gray-600">
                    {{ workspace.name }}
                  </span>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </UContainer>

    <!-- Create workspace form modal -->
    <UModal v-model="isOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="h-8">
            <h2 class="text-lg font-bold text-gray-600">Create new workspace</h2>
          </div>
        </template>

        <div class="h-24">
          <UForm id="create-workspace-form" :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
            <UFormGroup label="Name" name="name">
              <UInput v-model="state.name" />
            </UFormGroup>
          </UForm>
        </div>

        <template #footer>
          <div class="h-8">
            <UButton form="create-workspace-form" type="submit" class="bg-slate-600" color="indigo">
              Create
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'workspace-entry'
})

const toast = useToast()
const command = useCommand()

const workspaces = ref()
const loadWorkspaces = async () => {
  workspaces.value = await command.workspace.list()
}
await loadWorkspaces()

const isOpen = ref(false)
const openNewWorkspaceModal = () => {
  isOpen.value = true
}


const state = reactive({
  name: undefined,
})

const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.name) errors.push({ path: 'name', message: 'Required' })
  return errors
}

async function onSubmit(event: FormSubmitEvent<any>) {
  try {
    const created = await command.workspace.create({ name: event.data.name })
    toast.add({
      title: `Workspace ${created?.name} created successfully!`,
      timeout: 1000,
      icon: iconKey.success,
    });

    isOpen.value = false;
    await loadWorkspaces()
  } catch (error) {
    console.error(error)
    toast.add({
      title: "Failed to create.",
      description: "Please create again.",
      color: "red",
      icon: iconKey.failed,
    })
  }
}
</script>
