<template>
  <div>
    <UContainer style="padding-bottom: max(var(--spacing-xl), env(safe-area-inset-bottom));">
      <div class="space-y-6">
        <div class="pt-2">
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
          <UCard class="card-themed">
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

          <UCard class="card-themed">
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
              <MemoTemplateManager
                v-if="currentWorkspace"
                :workspace-slug="currentWorkspace.slug_name"
              />

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
      v-model:open="isDeleteConfirmationOpen"
      title="Delete workspace?"
      description="Once you delete a workspace, there is no going back. Please be certain."
      confirm-label="Delete"
      @confirm="deleteWorkspace"
    />
  </div>
</template>

<script setup lang="ts">
import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';

import { useWorkspaceSettings } from './useWorkspaceSettings';

import { MemoTemplateManager } from '~/features/memo-editing';
import { StoragePathsForm } from '~/features/storage-settings';
import ConfirmModal from '~/shared/components/overlays/ConfirmModal.vue';
import ThemeSelector from '~/shared/components/settings/ThemeSelector.vue';
import LoadingSpinner from '~/shared/components/status/LoadingSpinner.vue';
import { iconKey } from '~/utils/icon';

const { currentTheme } = useTheme();
const toast = useToast();
const router = useRouter();
const route = useRoute();
const {
  hasWorkspaceContext,
  currentWorkspace,
  isWorkspaceLoading,
  activeTab,
  isDeleteConfirmationOpen,
  openDeleteConfirmation,
  deleteWorkspace,
  loadWorkspaceSettings,
} = useWorkspaceSettings({
  route,
  router,
  toast,
});

const _appConfig = JSON.parse(await readTextFile('config.json', { baseDir: BaseDirectory.AppData }));
void _appConfig;

await usePageLoader(async () => {
  await loadWorkspaceSettings();
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
