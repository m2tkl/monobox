<template>
  <div class="size-full">
    <div class="border-top flex h-full w-full overflow-hidden">
      <aside
        class="border-right h-full"
        :class="{ 'w-[250px] shrink-0': ui.isSidebarOpen, 'hidden': !ui.isSidebarOpen }"
      >
        <SidebarMenu :is-open="ui.isSidebarOpen" />
      </aside>

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

    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import SidebarMenu from '~/app/shell/SidebarMenu/Index.vue';

const { ui } = useUIState();
</script>
