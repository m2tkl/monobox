<template>
  <div class="app-shell size-full">
    <div class="flex h-full w-full overflow-hidden">
      <aside
        v-if="ui.isSidebarOpen"
        class="app-sidebar border-right h-full shrink-0"
      >
        <SidebarMenu :is-open="true" />
      </aside>

      <div
        v-else
        class="sidebar-hover-zone"
        aria-hidden="true"
        @mouseenter="openFloatingSidebar"
      />

      <Transition name="floating-sidebar">
        <aside
          v-if="isFloatingSidebarVisible"
          class="floating-sidebar border-right h-full"
          @mouseenter="openFloatingSidebar"
          @mouseleave="scheduleFloatingSidebarClose"
        >
          <SidebarMenu
            :is-open="true"
            @floating-preview-enter="keepFloatingSidebarOpenForPreview"
            @floating-preview-leave="releaseFloatingSidebarPreview"
          />
        </aside>
      </Transition>

      <div class="flex h-full min-w-0 flex-1">
        <div class="size-full overflow-hidden">
          <main class="h-full w-full overflow-y-auto">
            <slot name="main" />
          </main>
        </div>
      </div>

      <FocusSidebar
        :is-open="ui.isFocusSidebarOpen"
        @close="ui.isFocusSidebarOpen = false"
      />

      <div
        v-if="!ui.isFocusSidebarOpen"
        class="focus-sidebar-hover-zone"
        aria-hidden="true"
        @mouseenter="openFloatingFocusSidebar"
      />

      <Transition name="floating-focus-sidebar">
        <aside
          v-if="isFloatingFocusSidebarVisible"
          class="floating-focus-sidebar border-left h-full"
          @mouseenter="openFloatingFocusSidebar"
          @mouseleave="closeFloatingFocusSidebar"
        >
          <FocusSidebar
            :is-open="true"
            floating
            @close="closeFloatingFocusSidebar"
          />
        </aside>
      </Transition>
    </div>

    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import { FocusSidebar } from '~/app/features/focus-memo';
import SidebarMenu from '~/app/scaffold/SidebarMenu/Index.vue';

const { ui } = useUIState();
const isFloatingSidebarVisible = ref(false);
const isFloatingSidebarPreviewActive = ref(false);
const isFloatingFocusSidebarVisible = ref(false);
let rightFocusSidebarMediaQuery: MediaQueryList | null = null;
let didInitializeRightFocusSidebar = false;
let floatingSidebarCloseTimer: number | null = null;

const clearFloatingSidebarCloseTimer = () => {
  if (floatingSidebarCloseTimer !== null) {
    window.clearTimeout(floatingSidebarCloseTimer);
    floatingSidebarCloseTimer = null;
  }
};

const openFloatingSidebar = () => {
  if (ui.value.isSidebarOpen) {
    return;
  }

  clearFloatingSidebarCloseTimer();
  isFloatingSidebarVisible.value = true;
};

const scheduleFloatingSidebarClose = () => {
  clearFloatingSidebarCloseTimer();
  floatingSidebarCloseTimer = window.setTimeout(() => {
    if (!isFloatingSidebarPreviewActive.value) {
      isFloatingSidebarVisible.value = false;
    }
    floatingSidebarCloseTimer = null;
  }, 180);
};

const keepFloatingSidebarOpenForPreview = () => {
  isFloatingSidebarPreviewActive.value = true;
  openFloatingSidebar();
};

const releaseFloatingSidebarPreview = () => {
  isFloatingSidebarPreviewActive.value = false;
  scheduleFloatingSidebarClose();
};

const openFloatingFocusSidebar = () => {
  if (ui.value.isFocusSidebarOpen) {
    return;
  }

  isFloatingFocusSidebarVisible.value = true;
};

const closeFloatingFocusSidebar = () => {
  isFloatingFocusSidebarVisible.value = false;
};

const syncRightFocusSidebarVisibility = () => {
  if (didInitializeRightFocusSidebar) return;
  if (rightFocusSidebarMediaQuery?.matches) {
    ui.value.isFocusSidebarOpen = true;
  }
  didInitializeRightFocusSidebar = true;
};

onMounted(() => {
  rightFocusSidebarMediaQuery = window.matchMedia('(min-width: 1280px)');
  syncRightFocusSidebarVisibility();
});

onUnmounted(() => {
  clearFloatingSidebarCloseTimer();
  rightFocusSidebarMediaQuery = null;
});
</script>

<style scoped>
.app-shell {
  position: relative;
  background-color: transparent;
}

.sidebar-hover-zone {
  position: fixed;
  top: var(--app-titlebar-height);
  left: 0;
  bottom: 0;
  width: 14px;
  z-index: 40;
}

.focus-sidebar-hover-zone {
  position: fixed;
  top: var(--app-titlebar-height);
  right: 0;
  bottom: 0;
  width: 14px;
  z-index: 40;
}

.app-sidebar {
  width: var(--app-sidebar-width);
  background-color: var(--color-background);
}

.floating-sidebar {
  position: fixed;
  top: var(--app-titlebar-height);
  left: 0;
  bottom: 0;
  width: var(--app-sidebar-width);
  z-index: 1100;
  background-color: var(--color-background);
  box-shadow: 0 16px 48px rgb(15 23 42 / 0.16);
}

.floating-focus-sidebar {
  position: fixed;
  top: var(--app-titlebar-height);
  right: 0;
  bottom: 0;
  width: 280px;
  z-index: 1100;
  background-color: var(--color-background);
  box-shadow: -16px 0 48px rgb(15 23 42 / 0.16);
}

.floating-sidebar-enter-active,
.floating-sidebar-leave-active,
.floating-focus-sidebar-enter-active,
.floating-focus-sidebar-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.floating-sidebar-enter-from,
.floating-sidebar-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.floating-sidebar-enter-to,
.floating-sidebar-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.floating-focus-sidebar-enter-from,
.floating-focus-sidebar-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.floating-focus-sidebar-enter-to,
.floating-focus-sidebar-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
