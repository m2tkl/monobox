<template>
  <div
    data-tauri-drag-region
    class="titlebar"
  >
    <!-- Window controls (macOS left, Windows right) -->
    <WindowControls />

    <!-- Left section -->
    <div
      class="flex flex-1 items-center gap-1.5 min-w-0"
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
          :icon="iconKey.home"
          @click="goHome"
        />

        <WorkspaceMenu
          :workspace-slug="workspaceSlug"
          class="pl-1 flex-shrink-0"
        />

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
      class="flex items-center justify-end gap-1.5 flex-shrink-0"
      data-tauri-drag-region
    >
      <ThemeToggle />

      <IconButton
        :icon="iconKey.setting"
        @click="goToSetting"
      />

      <!-- Windows controls appear here for Windows platform -->
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  workspaceTitle?: string;
}>();

const route = useRoute();
const router = useRouter();

const workspaceSlug = computed(() => route.params.workspace as string);
const memoTitleSlug = computed(() => route.params.memo as string);
const workspaceStore = useWorkspaceStore();

const goBack = () => router.go(-1);
const goNext = () => router.go(1);
const goHome = () => router.push(`/${workspaceStore.workspace?.slug_name}`);
const goToSetting = () => router.push('/_setting');

const { ui, toggleSidebar } = useUIState();
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
  padding: 0 16px;
  user-select: none;
  overscroll-behavior: none;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  background-color: var(--color-background);
  gap: 12px;
}

.titlebar-search-text {
  color: var(--color-text-muted);
}
</style>
