<template>
  <div class="size-full">
    <div class="border-top flex h-full w-full overflow-hidden">
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
        class="flex h-full w-[calc(100%-250px)] min-w-0 flex-1"
        :class="{ 'w-full justify-center': !ui.isSidebarOpen }"
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
const { ui } = useUIState();
</script>

<style scoped>
</style>
