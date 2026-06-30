<template>
  <div class="settings-page">
    <AppPageFrame
      variant="split"
      fill
    >
      <div class="settings-shell">
        <aside class="settings-sidebar border-right">
          <div class="settings-sidebar__inner">
            <h2 class="settings-title">
              Settings
            </h2>

            <nav
              class="settings-nav"
              aria-label="Settings"
            >
              <section
                v-for="group in settingGroups"
                :key="group.label"
                class="settings-nav-group"
              >
                <div class="settings-nav-heading">
                  <UIcon
                    :name="group.icon"
                    class="shrink-0"
                  />
                  <span>{{ group.label }}</span>
                </div>

                <button
                  v-for="item in group.items"
                  :key="item.id"
                  type="button"
                  class="settings-nav-item sidebar-link"
                  :class="{ 'is-active': activePanel === item.id }"
                  :disabled="item.disabled"
                  @click="activePanel = item.id"
                >
                  <span>{{ item.label }}</span>
                </button>
              </section>
            </nav>
          </div>
        </aside>

        <main class="settings-main">
          <div class="settings-main__inner">
            <header class="settings-section-header">
              <h3 class="settings-section-title">
                <span class="settings-section-group">{{ activePanelGroupLabel }}</span>
                <span class="settings-section-separator">/</span>
                <span>
                  {{ activePanelLabel }}
                </span>
              </h3>
            </header>

            <section class="settings-panel">
              <UCard
                v-if="activePanel === 'mcp-server'"
                class="card-themed"
              >
                <template #header>
                  <h4
                    class="text-base font-semibold"
                    style="color: var(--color-text-primary)"
                  >
                    Server info
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
                        class="settings-action-button"
                        size="sm"
                        color="neutral"
                        variant="outline"
                        :icon="iconKey.copy"
                        @click="copyMcpServerUrl"
                      >
                        Copy URL
                      </AppButton>

                      <AppButton
                        class="settings-action-button"
                        size="sm"
                        color="neutral"
                        variant="outline"
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

              <UCard
                v-else-if="activePanel === 'global-shortcuts'"
                class="card-themed"
              >
                <template #header>
                  <h4
                    class="text-base font-semibold"
                    style="color: var(--color-text-primary)"
                  >
                    Global shortcuts
                  </h4>
                </template>

                <div class="space-y-5">
                  <div class="settings-control settings-control--shortcut">
                    <div class="settings-control__label">
                      <div
                        class="text-sm font-medium"
                        style="color: var(--color-text-primary)"
                      >
                        Focus app
                      </div>
                      <div
                        class="text-xs"
                        style="color: var(--color-text-muted)"
                      >
                        Bring monobox to the front
                      </div>
                    </div>
                    <ShortcutBuilder
                      v-model="focusAppShortcut"
                      :disabled="isGlobalShortcutSaving"
                    />
                  </div>

                  <div class="settings-control settings-control--shortcut">
                    <div class="settings-control__label">
                      <div
                        class="text-sm font-medium"
                        style="color: var(--color-text-primary)"
                      >
                        New memo
                      </div>
                      <div
                        class="text-xs"
                        style="color: var(--color-text-muted)"
                      >
                        Create a memo in the active workspace
                      </div>
                    </div>
                    <ShortcutBuilder
                      v-model="newMemoShortcut"
                      :disabled="isGlobalShortcutSaving"
                    />
                  </div>

                  <div class="settings-actions">
                    <AppButton
                      size="sm"
                      color="primary"
                      :icon="iconKey.save"
                      :loading="isGlobalShortcutSaving"
                      :disabled="!isGlobalShortcutDirty"
                      @click="saveGlobalShortcuts"
                    >
                      Save shortcuts
                    </AppButton>
                  </div>
                </div>
              </UCard>

              <UCard
                v-else-if="activePanel === 'appearance'"
                class="card-themed"
              >
                <template #header>
                  <h4
                    class="text-base font-semibold"
                    style="color: var(--color-text-primary)"
                  >
                    Theme and window
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
                        color="primary"
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

              <AppCard
                v-else-if="activePanel === 'editor'"
                class="card-themed"
              >
                <template #header>
                  <h4
                    class="text-base font-semibold"
                    style="color: var(--color-text-primary)"
                  >
                    Editor
                  </h4>
                </template>

                <div class="space-y-5">
                  <div class="settings-control">
                    <div class="settings-control__label">
                      <div
                        class="text-sm font-medium"
                        style="color: var(--color-text-primary)"
                      >
                        Selection copy format
                      </div>
                      <div
                        class="text-xs"
                        style="color: var(--color-text-muted)"
                      >
                        Format used when copying selected text with the system copy shortcut.
                      </div>
                    </div>

                    <AppSelect
                      v-model="selectionCopyFormat"
                      :items="selectionCopyFormatOptions"
                      :disabled="isSelectionCopyFormatSaving"
                    />

                    <div class="settings-actions">
                      <AppButton
                        size="sm"
                        color="primary"
                        :icon="iconKey.save"
                        :loading="isSelectionCopyFormatSaving"
                        :disabled="!isSelectionCopyFormatDirty"
                        @click="saveSelectionCopyFormat"
                      >
                        Save copy format
                      </AppButton>
                    </div>
                  </div>
                </div>
              </AppCard>

              <UCard
                v-else-if="activePanel === 'storage-paths'"
                class="card-themed"
              >
                <template #header>
                  <h4
                    class="text-base font-semibold"
                    style="color: var(--color-text-primary)"
                  >
                    Storage paths
                  </h4>
                </template>

                <StoragePathsForm mode="settings" />
              </UCard>

              <UCard
                v-else-if="activePanel === 'files'"
                class="card-themed"
              >
                <template #header>
                  <h4
                    class="text-base font-semibold"
                    style="color: var(--color-text-primary)"
                  >
                    Files import
                  </h4>
                </template>

                <div class="space-y-5">
                  <div class="settings-control">
                    <div class="settings-control__label">
                      <div
                        class="text-sm font-medium"
                        style="color: var(--color-text-primary)"
                      >
                        Ignore file names
                      </div>
                      <div
                        class="text-xs"
                        style="color: var(--color-text-muted)"
                      >
                        One exact file name per line. Matching is case-insensitive.
                      </div>
                    </div>

                    <AppTextarea
                      v-model="inboxIgnoreFileNamesText"
                      :rows="5"
                      placeholder="desktop.ini"
                      :disabled="isInboxIgnoreSaving"
                    />

                    <div class="settings-actions">
                      <AppButton
                        size="sm"
                        color="primary"
                        :icon="iconKey.save"
                        :loading="isInboxIgnoreSaving"
                        :disabled="!isInboxIgnoreDirty"
                        @click="saveInboxIgnoreFileNames"
                      >
                        Save ignore list
                      </AppButton>
                    </div>
                  </div>
                </div>
              </UCard>

              <template v-else-if="activePanel === 'memo-templates'">
                <template v-if="hasWorkspaceContext">
                  <LoadingSpinner v-if="isWorkspaceLoading" />

                  <MemoTemplateManager
                    v-else-if="currentWorkspace"
                    :workspace-slug="currentWorkspace.slug_name"
                  />
                </template>

                <div
                  v-else
                  class="settings-empty"
                >
                  Open a workspace to manage workspace-specific settings.
                </div>
              </template>

              <template v-else-if="activePanel === 'statuses'">
                <template v-if="hasWorkspaceContext">
                  <LoadingSpinner v-if="isWorkspaceLoading || isStatusBoardLoading" />

                  <UCard
                    v-else-if="currentWorkspace"
                    class="card-themed"
                  >
                    <template #header>
                      <h4
                        class="text-base font-semibold"
                        style="color: var(--color-text-primary)"
                      >
                        Statuses
                      </h4>
                    </template>

                    <KanbanStatusManager
                      :workspace-slug="currentWorkspace.slug_name"
                      :kanban-id="statusKanbanId"
                    />
                  </UCard>
                </template>

                <div
                  v-else
                  class="settings-empty"
                >
                  Open a workspace to manage workspace-specific settings.
                </div>
              </template>

              <template v-else-if="activePanel === 'danger-zone'">
                <template v-if="hasWorkspaceContext">
                  <LoadingSpinner v-if="isWorkspaceLoading" />

                  <UCard
                    v-else-if="currentWorkspace"
                    class="card-themed"
                  >
                    <template #header>
                      <h4
                        class="text-base font-semibold"
                        style="color: var(--color-text-primary)"
                      >
                        Delete workspace
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

                <div
                  v-else
                  class="settings-empty"
                >
                  Open a workspace to manage workspace-specific settings.
                </div>
              </template>

              <UCard
                v-else
                class="card-themed"
              >
                <div
                  class="text-sm"
                  style="color: var(--color-text-muted)"
                >
                  Select a setting from the sidebar.
                </div>
              </UCard>
            </section>
          </div>
        </main>
      </div>
    </AppPageFrame>

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

import ShortcutBuilder from './ShortcutBuilder.vue';
import { useWorkspaceSettings } from './useWorkspaceSettings';

import AppButton from '~/app/elements/AppButton.vue';
import AppCard from '~/app/elements/AppCard.vue';
import AppTextarea from '~/app/elements/AppTextarea.vue';
import AppPageFrame from '~/app/elements/layout/AppPageFrame.vue';
import ConfirmModal from '~/app/elements/overlays/ConfirmModal.vue';
import ThemeSelector from '~/app/elements/settings/ThemeSelector.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
import { MemoTemplateManager } from '~/app/features/memo-templates';
import { StoragePathsForm } from '~/app/features/storage-settings';
import KanbanStatusManager from '~/app/features/workspace-kanban/view/workspace-kanban/KanbanStatusManager.vue';
import { command } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { loadGlobalStatusKanban } from '~/resources/kanban/globalStatus';
import { iconKey } from '~/utils/icon';

type SettingsPanelId =
  | 'mcp-server'
  | 'global-shortcuts'
  | 'appearance'
  | 'editor'
  | 'storage-paths'
  | 'files'
  | 'memo-templates'
  | 'statuses'
  | 'danger-zone';

type SettingsNavItem = {
  id: SettingsPanelId;
  label: string;
  disabled?: boolean;
};

type SettingsNavGroup = {
  label: 'App' | 'Workspace';
  icon: string;
  items: SettingsNavItem[];
};

const { currentTheme } = useTheme();
const toast = useToast();
const router = useRouter();
const route = useRoute();
const {
  hasWorkspaceContext,
  currentWorkspace,
  isWorkspaceLoading,
  activePanel,
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
const savedFocusAppShortcut = ref('');
const savedNewMemoShortcut = ref('');
const focusAppShortcut = ref('');
const newMemoShortcut = ref('');
const isGlobalShortcutSaving = ref(false);
const savedInboxIgnoreFileNames = ref<string[]>([]);
const inboxIgnoreFileNamesText = ref('');
const isInboxIgnoreSaving = ref(false);
const savedSelectionCopyFormat = ref('html');
const selectionCopyFormat = ref('html');
const isSelectionCopyFormatSaving = ref(false);
const statusKanbanId = ref<number | null>(null);
const isStatusBoardLoading = ref(false);
const selectionCopyFormatOptions = [
  { label: 'HTML', value: 'html' },
  { label: 'Markdown', value: 'markdown' },
];
const mcpServerStatus = computed(() => {
  if (!mcpServerInfo.value) return 'Unavailable';
  if (mcpServerRestartRequired.value) return 'Pending restart';
  if (!mcpServerInfo.value.setup_complete) return 'Setup incomplete';
  if (!mcpServerInfo.value.enabled) return 'Disabled';
  return 'Running inside this app';
});
const settingGroups = computed<SettingsNavGroup[]>(() => [
  {
    label: 'App',
    icon: iconKey.home,
    items: [
      { id: 'mcp-server', label: 'MCP' },
      { id: 'global-shortcuts', label: 'Shortcuts' },
      { id: 'appearance', label: 'Appearance' },
      { id: 'editor', label: 'Editor' },
      { id: 'storage-paths', label: 'Storage' },
      { id: 'files', label: 'Files' },
    ],
  },
  {
    label: 'Workspace',
    icon: iconKey.database,
    items: [
      { id: 'memo-templates', label: 'Templates', disabled: !hasWorkspaceContext.value },
      { id: 'statuses', label: 'Statuses', disabled: !hasWorkspaceContext.value },
      { id: 'danger-zone', label: 'Deletion', disabled: !hasWorkspaceContext.value },
    ],
  },
]);
const activePanelItem = computed(() => {
  for (const group of settingGroups.value) {
    const item = group.items.find(navItem => navItem.id === activePanel.value);
    if (item) {
      return { group, item };
    }
  }

  return { group: settingGroups.value[0], item: settingGroups.value[0]?.items[0] };
});
const activePanelLabel = computed(() => activePanelItem.value.item?.label ?? 'Settings');
const activePanelGroupLabel = computed(() => activePanelItem.value.group?.label ?? 'App');
const windowOpacityPercent = computed(() => Math.round(windowOpacity.value * 100));
const isWindowOpacityDirty = computed(() => (
  Math.abs(windowOpacity.value - savedWindowOpacity.value) > 0.001
));
const isGlobalShortcutDirty = computed(() => (
  focusAppShortcut.value.trim() !== savedFocusAppShortcut.value
  || newMemoShortcut.value.trim() !== savedNewMemoShortcut.value
));
const isInboxIgnoreDirty = computed(() => (
  normalizeInboxIgnoreFileNames(inboxIgnoreFileNamesText.value).join('\n')
  !== savedInboxIgnoreFileNames.value.join('\n')
));
const isSelectionCopyFormatDirty = computed(() => (
  normalizeSelectionCopyFormat(selectionCopyFormat.value) !== savedSelectionCopyFormat.value
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
    savedFocusAppShortcut.value = config.focus_app_shortcut;
    focusAppShortcut.value = config.focus_app_shortcut;
    savedNewMemoShortcut.value = config.new_memo_shortcut;
    newMemoShortcut.value = config.new_memo_shortcut;
    savedInboxIgnoreFileNames.value = normalizeInboxIgnoreFileNames(config.inbox_ignore_file_names);
    inboxIgnoreFileNamesText.value = savedInboxIgnoreFileNames.value.join('\n');
    savedSelectionCopyFormat.value = normalizeSelectionCopyFormat(config.selection_copy_format);
    selectionCopyFormat.value = savedSelectionCopyFormat.value;
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

const normalizeSelectionCopyFormat = (value: string | number | null | undefined) => (
  value === 'markdown' ? 'markdown' : 'html'
);

const saveSelectionCopyFormat = async () => {
  try {
    isSelectionCopyFormatSaving.value = true;
    const format = normalizeSelectionCopyFormat(selectionCopyFormat.value);
    const config = await command.config.setSelectionCopyFormat(format);
    savedSelectionCopyFormat.value = normalizeSelectionCopyFormat(config.selection_copy_format);
    selectionCopyFormat.value = savedSelectionCopyFormat.value;
    toast.add({
      title: 'Saved copy format.',
      duration: 1200,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to save copy format.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isSelectionCopyFormatSaving.value = false;
  }
};

const saveGlobalShortcuts = async () => {
  try {
    isGlobalShortcutSaving.value = true;
    const config = await command.config.setGlobalShortcuts({
      focusAppShortcut: focusAppShortcut.value,
      newMemoShortcut: newMemoShortcut.value,
    });
    savedFocusAppShortcut.value = config.focus_app_shortcut;
    focusAppShortcut.value = config.focus_app_shortcut;
    savedNewMemoShortcut.value = config.new_memo_shortcut;
    newMemoShortcut.value = config.new_memo_shortcut;
    toast.add({
      title: 'Saved global shortcuts.',
      duration: 1200,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to save global shortcuts.',
      description: shortcutErrorMessage(error),
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isGlobalShortcutSaving.value = false;
  }
};

const normalizeInboxIgnoreFileNames = (value: string | string[]) => {
  const lines = Array.isArray(value) ? value : value.split('\n');
  const names = lines
    .map(name => name.trim())
    .filter(Boolean);
  return Array.from(new Map(names.map(name => [name.toLowerCase(), name])).values())
    .sort((a, b) => a.localeCompare(b));
};

const saveInboxIgnoreFileNames = async () => {
  try {
    isInboxIgnoreSaving.value = true;
    const fileNames = normalizeInboxIgnoreFileNames(inboxIgnoreFileNamesText.value);
    const config = await command.config.setInboxIgnoreFileNames(fileNames);
    savedInboxIgnoreFileNames.value = normalizeInboxIgnoreFileNames(config.inbox_ignore_file_names);
    inboxIgnoreFileNamesText.value = savedInboxIgnoreFileNames.value.join('\n');
    void publishResourceChanges([changeRefs.inboxFileCollectionChanged()]);
    toast.add({
      title: 'Saved file ignore list.',
      duration: 1200,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to save file ignore list.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isInboxIgnoreSaving.value = false;
  }
};

const loadStatusBoard = async () => {
  const slugName = currentWorkspace.value?.slug_name;
  if (!slugName) {
    statusKanbanId.value = null;
    return;
  }

  try {
    isStatusBoardLoading.value = true;
    const kanban = await loadGlobalStatusKanban(slugName);
    statusKanbanId.value = kanban?.id ?? null;
  }
  catch (error) {
    console.error(error);
    statusKanbanId.value = null;
    toast.add({
      title: 'Failed to load statuses.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isStatusBoardLoading.value = false;
  }
};

const shortcutErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const [, detail] = message.split(':', 2);
  return detail || message;
};

await usePageLoader(async () => {
  await Promise.all([
    loadWorkspaceSettings(),
    loadMcpServerInfo(),
    loadAppAppearance(),
  ]);
  await loadStatusBoard();
});
</script>

<style scoped>
.settings-page {
  box-sizing: border-box;
  height: 100vh;
  min-height: 0;
  overflow: hidden;
}

.settings-shell {
  display: flex;
  height: 100%;
  min-height: 0;
}

.settings-sidebar {
  min-height: 0;
  width: 250px;
  flex-shrink: 0;
  background-color: transparent;
  overflow: hidden;
}

.settings-sidebar__inner {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem 1rem;
}

.settings-title {
  display: flex;
  min-height: 3rem;
  align-items: center;
  padding: 0 0.5rem;
  color: var(--color-text-secondary);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
}

.settings-nav {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.settings-nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.settings-nav-heading {
  display: flex;
  height: 2rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.settings-nav-item {
  display: flex;
  min-height: 1.75rem;
  width: 100%;
  align-items: center;
  border-radius: 0.375rem;
  padding: 0.1875rem 0.5rem 0.1875rem 1.75rem;
  font-size: 0.875rem;
  text-align: left;
}

.settings-nav-item:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.settings-main {
  min-height: 0;
  min-width: 0;
  flex: 1;
  overflow-y: auto;
}

.settings-main__inner {
  width: min(100%, 960px);
  padding: 0.375rem 1.5rem max(var(--spacing-xl), env(safe-area-inset-bottom));
}

.settings-section-header {
  display: flex;
  min-height: 3rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.375rem;
}

.settings-section-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
}

.settings-section-group {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
}

.settings-section-separator {
  color: var(--color-text-muted);
  font-weight: 500;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 760px;
}

.settings-empty {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

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

:deep(.settings-action-button) {
  min-height: 2rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid color-mix(in srgb, var(--color-border-light) 78%, transparent) !important;
  border-radius: 0.375rem;
  background-color: color-mix(in srgb, var(--color-surface-elevated) 86%, var(--color-background)) !important;
  box-shadow: none;
  color: var(--color-text-primary) !important;
}

:deep(.settings-action-button:hover),
:deep(.settings-action-button:focus-visible) {
  border-color: color-mix(in srgb, var(--color-border-hover) 72%, var(--color-border-light)) !important;
  background-color: var(--color-surface-hover) !important;
}

.dark :deep(.settings-action-button) {
  border-color: color-mix(in srgb, var(--color-text-muted) 80%, var(--color-primary)) !important;
  background-color: color-mix(in srgb, var(--color-surface-elevated) 72%, var(--color-background)) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-text-muted) 22%, transparent);
}

.dark :deep(.settings-action-button:hover),
.dark :deep(.settings-action-button:focus-visible) {
  border-color: color-mix(in srgb, var(--color-text-secondary) 82%, var(--color-primary)) !important;
}

.settings-control {
  max-width: 360px;
}

.settings-control--shortcut {
  max-width: 30rem;
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

@media (max-width: 720px) {
  .settings-shell {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }

  .settings-sidebar__inner {
    height: auto;
  }

  .settings-nav {
    max-height: 220px;
  }

  .settings-main__inner {
    padding: 1rem;
  }
}
</style>
