<template>
  <div class="size-full">
    <div class="border-top flex h-full w-full overflow-hidden">
      <!-- Activity Bar -->
      <ActivityBar />

      <!-- Sidebar -->
      <aside
        class="border-right h-full"
        :class="{ 'w-[250px] shrink-0': ui.isSidebarOpen, 'hidden': !ui.isSidebarOpen }"
      >
        <!-- TODO: Since the display is toggled using hidden, control with v-if is unnecessary. -->
        <SidebarMenu :is-open="ui.isSidebarOpen" />
      </aside>

      <!-- Main content -->
      <div
        class="flex h-full min-w-0 flex-1"
        :class="{ 'justify-center': !ui.isSidebarOpen }"
      >
        <div
          :class="{ 'max-w-7xl': !ui.isSidebarOpen }"
          class="size-full overflow-hidden"
        >
          <!--
            NOTE:
            - 40px: header height
          -->
          <main
            class="h-full w-full overflow-y-auto"
          >
            <slot name="main" />
          </main>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import ActivityBar from '~/app/chrome/ActivityBar/Index.vue';
import SidebarMenu from '~/app/chrome/SidebarMenu/Index.vue';

const { ui } = useUIState();
</script>

<style scoped>
</style>
