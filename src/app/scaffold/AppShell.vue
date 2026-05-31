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
          @mouseleave="closeFloatingSidebar"
        >
          <SidebarMenu :is-open="true" />
        </aside>
      </Transition>

      <div
        class="flex h-full min-w-0 flex-1"
        :class="{ 'justify-center': !ui.isSidebarOpen }"
      >
        <div
          :class="{ 'max-w-7xl': !ui.isSidebarOpen }"
          class="size-full overflow-hidden"
        >
          <main class="h-full w-full overflow-y-auto">
            <slot name="main" />
          </main>
        </div>
      </div>
    </div>

    <FocusMemoDrawer />
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import { FocusMemoDrawer } from '~/app/features/focus-memo';
import SidebarMenu from '~/app/scaffold/SidebarMenu/Index.vue';

const { ui } = useUIState();
const isFloatingSidebarVisible = ref(false);

const openFloatingSidebar = () => {
  if (ui.value.isSidebarOpen) {
    return;
  }

  isFloatingSidebarVisible.value = true;
};

const closeFloatingSidebar = () => {
  isFloatingSidebarVisible.value = false;
};
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

.floating-sidebar-enter-active,
.floating-sidebar-leave-active {
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
</style>
