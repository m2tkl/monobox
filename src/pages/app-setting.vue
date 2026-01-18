<template>
  <div>
    <UContainer style="padding-bottom: max(var(--spacing-xl), env(safe-area-inset-bottom));">
      <div class="space-y-6">
        <div class="flex items-center justify-between space-x-3 pt-2">
          <h2
            class="pl-1 text-2xl font-bold"
            style="color: var(--color-text-primary)"
          >
            Settings
          </h2>
        </div>

        <div
          v-if="hasWorkspaceContext"
          class="settings-tabs"
        >
          <button
            type="button"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === 'app' }"
            @click="activeTab = 'app'"
          >
            <UIcon :name="iconKey.home" />
            <span>App</span>
          </button>
          <button
            type="button"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === 'workspace' }"
            @click="activeTab = 'workspace'"
          >
            <UIcon :name="iconKey.database" />
            <span>Workspace</span>
          </button>
        </div>

        <section
          v-if="activeTab === 'app'"
          class="space-y-4"
        >
          <!-- Theme Settings -->
          <UCard
            class="card-themed"
          >
            <template #header>
              <h4
                class="text-base font-semibold"
                style="color: var(--color-text-primary)"
              >
                Appearance
              </h4>
            </template>

            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <ThemeSelector />
                <span
                  class="text-sm"
                  style="color: var(--color-text-secondary)"
                >
                  Current: {{ currentTheme.config.name }} - {{ currentTheme.config.description }}
                </span>
              </div>
            </div>
          </UCard>

          <!-- Storage Paths -->
          <UCard
            class="card-themed"
          >
            <template #header>
              <h4
                class="text-base font-semibold"
                style="color: var(--color-text-primary)"
              >
                Storage Paths
              </h4>
            </template>

            <StoragePathsForm mode="settings" />
          </UCard>
        </section>

        <section
          v-if="activeTab === 'workspace'"
          class="space-y-4"
        >
          <template v-if="hasWorkspaceContext">
            <LoadingSpinner v-if="isWorkspaceLoading" />

            <template v-else>
              <UCard
                v-if="currentWorkspace"
                class="card-themed"
              >
                <template #header>
                  <h4
                    class="text-base font-semibold"
                    style="color: var(--color-text-primary)"
                  >
                    Danger zone
                  </h4>
                </template>
                <UButton
                  color="error"
                  variant="subtle"
                  @click="openDeleteConfirmation"
                >
                  Delete this workspace
                </UButton>
              </UCard>
            </template>
          </template>

          <div
            v-else
            class="text-sm"
            style="color: var(--color-text-muted)"
          >
            Open a workspace to manage workspace-specific settings.
          </div>
        </section>
      </div>
    </UContainer>

    <ConfirmModal
      v-model:open="isOpen"
      title="Delete workspace?"
      description="Once you delete a workspace, there is no going back. Please be certain."
      confirm-label="Delete"
      @confirm="deleteWorkspace"
    />
  </div>
</template>

<script setup lang="ts">
import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';

import StoragePathsForm from '~/app/features/settings/StoragePathsForm.vue';
import ThemeSelector from '~/app/features/settings/ThemeSelector.vue';
import ConfirmModal from '~/app/ui/ConfirmModal.vue';
import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import { command } from '~/external/tauri/command';
import { emitEvent } from '~/resource-state/infra/eventBus';
import { loadWorkspace } from '~/resource-state/resources/workspace';
import { useCurrentWorkspaceViewModel } from '~/resource-state/viewmodels/currentWorkspace';
import { iconKey } from '~/utils/icon';

definePageMeta({
  path: '/_setting',
});

const { currentTheme } = useTheme();
const toast = useToast();
const router = useRouter();

const route = useRoute();
const currentWorkspaceVM = useCurrentWorkspaceViewModel();
const workspaceContextSlug = computed(() => {
  const raw = route.query.workspace;
  return typeof raw === 'string' ? raw : '';
});
const hasWorkspaceContext = computed(() => workspaceContextSlug.value.length > 0);
const currentWorkspace = computed(() => {
  if (!hasWorkspaceContext.value) return null;
  const workspace = currentWorkspaceVM.value.data.workspace;
  if (!workspace) return null;
  return workspace.slug_name === workspaceContextSlug.value ? workspace : null;
});
const isWorkspaceLoading = computed(() => {
  return hasWorkspaceContext.value && currentWorkspaceVM.value.flags.isLoading;
});

const activeTab = ref<'app' | 'workspace'>(hasWorkspaceContext.value ? 'workspace' : 'app');
watch(hasWorkspaceContext, (next) => {
  if (!next) {
    activeTab.value = 'app';
  }
  else if (activeTab.value === 'app') {
    activeTab.value = 'workspace';
  }
});

const isOpen = ref(false);
const openDeleteConfirmation = () => {
  isOpen.value = true;
};

const deleteWorkspace = async () => {
  const slugName = currentWorkspace.value?.slug_name;
  if (!slugName) {
    toast.add({
      title: 'Workspace is not selected.',
      color: 'error',
      icon: iconKey.failed,
    });
    return;
  }

  try {
    await command.workspace.delete({ slugName });

    toast.add({
      title: 'Delete successfully.',
      duration: 1000,
      icon: iconKey.success,
    });

    emitEvent('workspace/deleted', undefined);
    isOpen.value = false;
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

/**
 * FIXME: Accessing the "_setting" route but triggers an error on Windows
 * due to a different configuration file path.
 *
 * On Windows, Tauri attempts to load:
 *  C:\Users\$username\AppData\Roaming\com.m2tkl.monobox\config.json
 *  which fails with "The system cannot find the path specified (os error 3)".
 *
 * The actual config file was found here instead:
 * C:\Users\$username\AppData\Roaming\m2tkl\monobox\config\config.json
 */
const _appConfig = JSON.parse(await readTextFile('config.json', { baseDir: BaseDirectory.AppData }));

await usePageLoader(async () => {
  if (!hasWorkspaceContext.value) return;
  await loadWorkspace(workspaceContextSlug.value);
});

watch(workspaceContextSlug, async (slug) => {
  if (!slug) return;
  await loadWorkspace(slug);
});
</script>

<style scoped>
.card-themed {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border-light);
}

:deep(.card-themed .divide-y > *) {
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.card-themed [data-headlessui-state]) {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
}

.settings-tabs {
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border-radius: 10px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
}

.settings-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  background-color: transparent;
  border: 1px solid transparent;
}

.settings-tab--active {
  color: var(--color-text-primary);
  background-color: var(--color-surface-elevated);
  border-color: var(--color-border-light);
}
</style>
