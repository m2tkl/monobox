<template>
  <NuxtLayout name="workspace-entry">
    <div>
      <UContainer>
        <div>
          <!-- Project collection header -->
          <div class="flex items-center justify-between space-x-3 pb-4 pt-2">
            <h2 class="pl-1 text-2xl font-bold text-gray-600">
              Workspace
            </h2>
            <UButton
              class="bg-slate-600"
              @click="openNewWorkspaceModal"
            >
              New
            </UButton>
          </div>

          <!-- Project collection -->
          <div v-if="workspaces.length === 0">
            No workspace
          </div>
          <div v-else>
            <ul class="divide-y divide-gray-400 rounded-md border border-gray-400">
              <li
                v-for="workspace in workspaces"
                :key="workspace.id"
                class="hover:bg-slate-300"
              >
                <NuxtLink :to="`/${workspace.slug_name}`">
                  <div class="flex items-center justify-between px-4 py-2">
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
      <UModal
        v-model:open="isOpen"
        title="Create new workspace"
      >
        <template #body>
          <div class="h-24">
            <UForm
              id="create-workspace-form"
              :validate="validate"
              :state="state"
              class="space-y-4"
              @submit="onSubmit"
            >
              <UFormField
                label="Name"
                name="name"
              >
                <UInput
                  v-model="state.name"
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
              class="bg-slate-600"
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
import type { FormError, FormSubmitEvent } from '#ui/types';

definePageMeta({
  path: '/',
});

const toast = useToast();
const command = useCommand();
const store = useWorkspaceStore();

store.exitWorkspace();

const workspaces = computed(() => store.workspaces);

const isOpen = ref(false);
const openNewWorkspaceModal = () => {
  isOpen.value = true;
};

type State = { name?: string };
const state = reactive<State>({
  name: undefined,
});

const validate = (state: State): FormError[] => {
  const errors = [];
  if (!state.name) errors.push({ path: 'name', message: 'Required' });
  return errors;
};

async function onSubmit(event: FormSubmitEvent<State>) {
  try {
    if (!event.data.name) {
      throw Error('name is required.');
    }
    const created = await command.workspace.create({ name: event.data.name });
    toast.add({
      title: `Workspace ${created?.name} created successfully!`,
      duration: 1000,
      icon: iconKey.success,
    });

    isOpen.value = false;
    emitEvent('workspace/created', undefined);
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to create.',
      description: 'Please create again.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
}
</script>
