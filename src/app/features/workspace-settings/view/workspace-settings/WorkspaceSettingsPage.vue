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
                MCP Server
              </h4>
            </template>

            <div
              v-if="mcpServerInfo"
              class="space-y-4"
            >
              <div class="text-sm">
                <div style="color: var(--color-text-secondary);">
                  Status
                </div>
                <div style="color: var(--color-text-primary);">
                  {{ mcpServerStatus }}
                </div>
              </div>

              <div class="text-sm">
                <div style="color: var(--color-text-secondary);">
                  URL
                </div>
                <code class="settings-code">{{ mcpServerInfo.url }}</code>
                <div class="settings-actions">
                  <AppButton
                    size="sm"
                    variant="subtle"
                    :icon="iconKey.copy"
                    @click="copyMcpServerUrl"
                  >
                    Copy URL
                  </AppButton>

                  <AppButton
                    size="sm"
                    variant="subtle"
                    :icon="iconKey.renew"
                    @click="regenerateMcpServerUrl"
                  >
                    Regenerate URL
                  </AppButton>
                </div>
              </div>

              <div
                v-if="mcpServerRestartRequired"
                class="text-sm"
                style="color: var(--color-text-secondary);"
              >
                Restart monobox before using the regenerated URL from Codex.
              </div>
            </div>

            <div
              v-else
              class="text-sm"
              style="color: var(--color-text-muted)"
            >
              Failed to load MCP server info.
            </div>
          </UCard>

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

              <div class="settings-control">
                <div class="settings-control__label">
                  <div
                    class="text-sm font-medium"
                    style="color: var(--color-text-primary)"
                  >
                    Background opacity
                  </div>
                  <div
                    class="text-xs"
                    style="color: var(--color-text-muted)"
                  >
                    {{ windowOpacityPercent }}%
                  </div>
                </div>

                <input
                  v-model.number="windowOpacity"
                  class="settings-range"
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.05"
                  :disabled="isWindowOpacitySaving"
                  @input="applyWindowOpacity(windowOpacity)"
                >

                <div class="settings-actions">
                  <AppButton
                    size="sm"
                    variant="subtle"
                    :icon="iconKey.save"
                    :loading="isWindowOpacitySaving"
                    :disabled="!isWindowOpacityDirty"
                    @click="saveWindowOpacity"
                  >
                    Save background opacity
                  </AppButton>
                </div>
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
                <AppButton
                  color="error"
                  variant="subtle"
                  @click="openDeleteConfirmation"
                >
                  Delete this workspace
                </AppButton>
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
import { computed, ref } from 'vue';

import { useWorkspaceSettings } from './useWorkspaceSettings';

import AppButton from '~/app/elements/AppButton.vue';
import ConfirmModal from '~/app/elements/overlays/ConfirmModal.vue';
import ThemeSelector from '~/app/elements/settings/ThemeSelector.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
import { MemoTemplateManager } from '~/app/features/memo-templates';
import { StoragePathsForm } from '~/app/features/storage-settings';
import { command } from '~/external/tauri/command';
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
const mcpServerInfo = ref<Awaited<ReturnType<typeof command.config.mcpServerInfo>> | null>(null);
const mcpServerRestartRequired = ref(false);
const savedWindowOpacity = ref(1);
const windowOpacity = ref(1);
const isWindowOpacitySaving = ref(false);
const mcpServerStatus = computed(() => {
  if (!mcpServerInfo.value) return 'Unavailable';
  if (mcpServerRestartRequired.value) return 'Pending restart';
  if (!mcpServerInfo.value.setup_complete) return 'Setup incomplete';
  if (!mcpServerInfo.value.enabled) return 'Disabled';
  return 'Running inside this app';
});
const windowOpacityPercent = computed(() => Math.round(windowOpacity.value * 100));
const isWindowOpacityDirty = computed(() => (
  Math.abs(windowOpacity.value - savedWindowOpacity.value) > 0.001
));

const applyWindowOpacity = (opacity: number) => {
  document.documentElement.style.setProperty('--app-window-opacity', String(opacity));
};

const loadMcpServerInfo = async () => {
  try {
    mcpServerInfo.value = await command.config.mcpServerInfo();
    mcpServerRestartRequired.value = false;
  }
  catch (error) {
    console.error(error);
    mcpServerInfo.value = null;
  }
};

const copyMcpServerUrl = async () => {
  if (!mcpServerInfo.value) return;

  try {
    await navigator.clipboard.writeText(mcpServerInfo.value.url);
    toast.add({
      title: 'Copied MCP URL.',
      duration: 1200,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to copy MCP URL.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};

const regenerateMcpServerUrl = async () => {
  try {
    mcpServerInfo.value = await command.config.regenerateMcpServerToken();
    mcpServerRestartRequired.value = true;
    toast.add({
      title: 'Generated a new MCP URL.',
      description: 'Restart monobox, then update Codex to the new URL.',
      duration: 2500,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to regenerate MCP URL.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};

const loadAppAppearance = async () => {
  try {
    const config = await command.config.get();
    savedWindowOpacity.value = config.app_window_opacity;
    windowOpacity.value = config.app_window_opacity;
    applyWindowOpacity(config.app_window_opacity);
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to load appearance settings.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};

const saveWindowOpacity = async () => {
  try {
    isWindowOpacitySaving.value = true;
    const config = await command.config.setAppWindowOpacity(windowOpacity.value);
    savedWindowOpacity.value = config.app_window_opacity;
    windowOpacity.value = config.app_window_opacity;
    applyWindowOpacity(config.app_window_opacity);
    toast.add({
      title: 'Saved window opacity.',
      duration: 1200,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to save window opacity.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isWindowOpacitySaving.value = false;
  }
};

await usePageLoader(async () => {
  await Promise.all([
    loadWorkspaceSettings(),
    loadMcpServerInfo(),
    loadAppAppearance(),
  ]);
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

.settings-code {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  overflow-wrap: anywhere;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.settings-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.settings-control {
  max-width: 360px;
}

.settings-control__label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.settings-range {
  width: 100%;
  accent-color: var(--color-primary);
}
</style>
