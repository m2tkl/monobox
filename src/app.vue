<template>
  <div>
    <NuxtRouteAnnouncer />

    <UApp>
      <TitleBar />
      <NuxtPage class="h-screen pt-[var(--app-titlebar-height)]" />
      <ImagePreviewDialog />
    </UApp>
  </div>
</template>

<script setup lang="ts">
import { listen } from '@tauri-apps/api/event';

import type { UnlistenFn } from '@tauri-apps/api/event';

import { ImagePreviewDialog } from '~/app/features/memo-editing';
import TitleBar from '~/app/scaffold/TitleBar.vue';
import { command } from '~/external/tauri/command';
import { handleError } from '~/utils/error';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const NEW_MEMO_SHORTCUT_EVENT = 'monobox:shortcut:global:new-memo';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const colorMode = useColorMode();
const isHandlingNewMemoShortcut = ref(false);
let unlistenNewMemoShortcut: UnlistenFn | null = null;

onMounted(async () => {
  try {
    const config = await command.config.get();
    if (config.theme_preference === 'light' || config.theme_preference === 'dark') {
      colorMode.preference = config.theme_preference;
    }
    document.documentElement.style.setProperty(
      '--app-window-opacity',
      String(config.app_window_opacity),
    );
    const shouldRedirect = await needsSetup(config);
    if (shouldRedirect) {
      await router.replace('/_setup');
      return;
    }
    unlistenNewMemoShortcut = await listen(NEW_MEMO_SHORTCUT_EVENT, openNewMemoFromGlobalShortcut);
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to load config.',
      description: appError.message,
      color: 'error',
    });
  }
});

onUnmounted(() => {
  unlistenNewMemoShortcut?.();
  unlistenNewMemoShortcut = null;
});

const needsSetup = async (config: {
  database_path: string;
  asset_dir_path: string;
  setup_complete: boolean;
}) => {
  if (route.path === '/_setup') {
    return false;
  }

  const hasPaths = config.database_path.length > 0 && config.asset_dir_path.length > 0;
  if (!config.setup_complete || !hasPaths) {
    return true;
  }

  try {
    await command.config.validate();
    return false;
  }
  catch {
    return true;
  }
};

const openNewMemoFromGlobalShortcut = async () => {
  if (isHandlingNewMemoShortcut.value || route.path === '/_setup') {
    return;
  }

  isHandlingNewMemoShortcut.value = true;
  try {
    const workspaceSlug = await resolveActiveWorkspaceSlug();
    if (!workspaceSlug) {
      toast.add({
        title: 'No workspace selected.',
        description: 'Open a workspace once before using the new memo shortcut.',
        color: 'warning',
      });
      return;
    }

    await router.push(`/${workspaceSlug}/__new__`);
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to open new memo.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isHandlingNewMemoShortcut.value = false;
  }
};

const resolveActiveWorkspaceSlug = async () => {
  const workspaceSlug = getEncodedWorkspaceSlugFromPath(route);
  if (workspaceSlug && !workspaceSlug.startsWith('_')) {
    return workspaceSlug;
  }

  const currentMemo = await command.memo.getCurrent();
  return currentMemo?.workspace_slug_name ?? '';
};
</script>
