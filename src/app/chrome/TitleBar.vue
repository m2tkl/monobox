<template>
  <div
    data-tauri-drag-region
    class="titlebar"
  >
    <!-- Window controls (macOS left, Windows right) -->
    <WindowControls />

    <!-- Left section -->
    <div
      class="flex flex-1 items-center gap-1.5 min-w-0 pl-4"
      data-tauri-drag-region
    >
      <!-- Essential controls that should always be visible -->
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <IconButton
          :icon="ui.isSidebarOpen ? iconKey.sidebarClose : iconKey.sidebarOpen"
          @click="toggleSidebar"
        />

        <IconButton
          :icon="iconKey.arrowLeft"
          @click="goBack"
        />
        <IconButton
          :icon="iconKey.arrowRight"
          @click="goNext"
        />

        <IconButton
          v-if="workspaceSlug"
          :icon="iconKey.home"
          @click="goHome"
        />

        <IconButton
          v-else
          :icon="iconKey.database"
        />

        <UDropdownMenu
          v-if="workspaceSlug"
          class="pl-1 flex-shrink-0"
          :items="workspaceMenuItems"
          :content="{
            align: 'start',
            side: 'bottom',
            sideOffset: 8,
          }"
        >
          <div class="flex items-center">
            <UButton
              :label="workspaceName"
              variant="subtle"
              color="neutral"
              size="sm"
            />
          </div>
        </UDropdownMenu>

        <span
          class="text-xs"
          style="color: var(--color-text-muted)"
        >|</span>
      </div>

      <!-- Memo slug that can be truncated -->
      <div
        class="text-xs truncate min-w-0 flex-1"
        data-tauri-drag-region
      >
        <span
          style="color: var(--color-text-primary)"
          data-tauri-drag-region
        >{{ memoTitleSlug }}</span>
        <span
          class="ml-2"
          style="color: var(--color-text-muted)"
          data-tauri-drag-region
        >{{ route.hash }}</span>
      </div>
    </div>

    <!-- Right section -->
    <div
      class="flex items-center justify-end gap-1.5 flex-shrink-0 pr-4"
      data-tauri-drag-region
    >
      <ThemeToggle />

      <!--
        NOTE: Accessing the "_setting" route from the custom Titlebar works on macOS
        but triggers an error on Windows due to a different configuration file path.

        On Windows, Tauri attempts to load:
          C:\Users\$username\AppData\Roaming\com.m2tkl.monobox\config.json
        which fails with "The system cannot find the path specified (os error 3)".

        The actual config file was found here instead:
          C:\Users\$username\AppData\Roaming\m2tkl\monobox\config\config.json

        Since the "_setting" route was originally exposed only for theme switching
        and we now have a ThemeToggle button directly on the Titlebar,
        navigation to "_setting" is no longer necessary.
        For now, the entry point to "_setting" is removed as a workaround.
      -->
      <!-- <IconButton
        :icon="iconKey.setting"
        @click="goToSetting"
      /> -->

      <!-- Windows controls appear here for Windows platform -->
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

import IconButton from '~/app/ui/IconButton.vue';
import ThemeToggle from '~/app/chrome/ThemeToggle.vue';
import WindowControls from '~/app/chrome/WindowControls.vue';

import { useCurrentWorkspaceViewModel } from '~/resource-state/viewmodels/currentWorkspace';

defineProps<{
  workspaceTitle?: string;
}>();

const route = useRoute();
const router = useRouter();

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const memoTitleSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

const currentWorkspaceVM = useCurrentWorkspaceViewModel();

const goBack = () => router.go(-1);
const goNext = () => router.go(1);
const goHome = () => {
  const slug = currentWorkspaceVM.value.data.workspace?.slug_name || workspaceSlug.value || '';
  if (slug) router.push(`/${slug}`);
};

const { ui, toggleSidebar } = useUIState();

const workspaceName = computed(() => currentWorkspaceVM.value.data?.workspace?.name ?? '');

const workspaceMenuItems: ComputedRef<DropdownMenuItem[][]> = computed(() => [
  [
    {
      label: 'Switch workspace',
      icon: iconKey.switch,
      to: '/',
    },
    {
      label: 'Workspace setting',
      icon: iconKey.setting,
      to: `/${workspaceSlug.value}/_setting`,
    },
  ],
]);
</script>

<style scoped>
/* Title bar utilities */
.titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 3rem;
  width: 100%;
  color: var(--color-text-primary);
  padding: 0;
  user-select: none;
  overscroll-behavior: none;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  background-color: var(--color-background);
}

.titlebar-search-text {
  color: var(--color-text-muted);
}
</style>
