<template>
  <div
    data-tauri-drag-region
    class="titlebar"
  >
    <div
      class="titlebar-sidebar"
      data-tauri-drag-region
    >
      <WindowControls placement="sidebar" />

      <div
        class="titlebar-sidebar__controls"
        data-tauri-drag-region
      >
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

        <template v-if="workspaceSlug && !ui.isSidebarOpen">
          <IconButton
            :icon="iconKey.add"
            :disabled="isNavigatingToNewMemo"
            aria-label="New memo"
            @click="goToNewMemo()"
          />
        </template>
      </div>
    </div>

    <div
      class="titlebar-main"
      data-tauri-drag-region
    >
      <div class="titlebar-workspace">
        <UDropdownMenu
          v-if="workspaceSlug"
          :items="workspaceMenuItems"
          :content="{
            align: 'start',
            side: 'bottom',
            sideOffset: 8,
          }"
        >
          <div class="flex items-center">
            <AppButton
              :label="workspaceName"
              variant="subtle"
              color="neutral"
              size="sm"
            />
          </div>
        </UDropdownMenu>

        <span
          v-if="workspaceSlug"
          class="text-xs"
          style="color: var(--color-text-muted)"
        >|</span>
      </div>

      <div
        class="titlebar-route"
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

      <div
        class="titlebar-actions"
        data-tauri-drag-region
      >
        <ThemeToggle />
        <WindowControls placement="actions" />

        <!-- Theme switching is handled directly in the title bar. -->
        <!-- <IconButton
          :icon="iconKey.setting"
          @click="goToSetting"
        /> -->

        <!-- Windows controls appear here for Windows platform -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

import IconButton from '~/app/elements/IconButton.vue';
import ThemeToggle from '~/app/scaffold/ThemeToggle.vue';
import { useTitleBarWorkspace } from '~/app/scaffold/useTitleBarWorkspace';
import WindowControls from '~/app/scaffold/WindowControls.vue';

defineProps<{
  workspaceTitle?: string;
}>();

const router = useRouter();
const {
  route,
  workspaceSlug,
  memoTitleSlug,
  workspaceReadModel,
  workspaceName,
} = useTitleBarWorkspace();

const goBack = () => router.go(-1);
const goNext = () => router.go(1);
const goHome = () => {
  const slug = workspaceReadModel.value.data.workspace?.slug_name || workspaceSlug.value || '';
  if (slug) router.push(`/${slug}`);
};

const { ui, toggleSidebar } = useUIState();
const isNavigatingToNewMemo = ref(false);

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
      to: `/_setting?workspace=${workspaceSlug.value}`,
    },
  ],
]);

async function goToNewMemo() {
  if (!workspaceSlug.value) {
    return;
  }

  isNavigatingToNewMemo.value = true;
  try {
    await router.push({
      path: `/${workspaceSlug.value}/__new__`,
    });
  }
  finally {
    isNavigatingToNewMemo.value = false;
  }
}
</script>

<style scoped>
/* Title bar utilities */
.titlebar {
  display: flex;
  align-items: center;
  height: var(--app-titlebar-height);
  width: 100%;
  color: var(--color-text-primary);
  padding: 0;
  user-select: none;
  overscroll-behavior: none;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--color-border-light);
  background-color: var(--color-background);
}

.titlebar-sidebar {
  display: flex;
  align-items: center;
  width: var(--app-sidebar-width);
  height: 100%;
  min-width: var(--app-sidebar-width);
  background-color: var(--color-background);
  border-right: 1px solid var(--color-border-light);
}

.titlebar-sidebar__controls {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  gap: 0.375rem;
  padding-left: 1rem;
  padding-right: 0.75rem;
}

.titlebar-main {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding: 0 1rem;
  background-color: var(--color-background);
}

.titlebar-workspace {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.titlebar-route {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
}

.titlebar-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 0.375rem;
  height: 100%;
}

.titlebar-actions :deep(.window-controls.windows) {
  margin-right: -1rem;
  margin-left: 0.625rem;
}

.titlebar-search-text {
  color: var(--color-text-muted);
}
</style>
