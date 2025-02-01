<template>
  <div>
    <TitleBar :workspace-title="wspace?.name" />

    <div class="h-screen w-full flex pt-[30px]">
      <!-- Sidebar -->
      <aside
        class="sidebar-area h-[calc(100vh-30px)] overflow-auto"
        :class="{ 'w-[250px] flex-shrink-0': ui.isSidebarOpen, 'hidden': !ui.isSidebarOpen }"
      >
        <SidebarMenu :is-open="ui.isSidebarOpen" />
      </aside>

      <!-- Main content -->
      <div
        class="flex-1 h-full flex w-[calc(100%-250px)] min-w-0"
        :class="{ 'justify-center w-full': !ui.isSidebarOpen }"
      >
        <div
          :class="{ 'max-w-7xl': !ui.isSidebarOpen }"
          class="h-full w-full"
        >
          <header class="sticky top-0 z-50 flex h-14 items-center gap-3 bg-slate-200 px-6">
            <!-- Workspace/**  -->
            <div
              v-if="$route.params.workspace"
              class="flex items-center w-full"
            >
              <div class="flex items-center gap-2.5 w-full">
                <h1 class="font-mono text-xl text-slate-500 gap-1.5 flex items-center w-full">
                  <USkeleton
                    v-if="!wspace"
                    class="h-6 w-[250px]"
                  />
                  <NuxtLink
                    v-else
                    :to="`/${$route.params.workspace}`"
                    class="flex items-center"
                  >
                    <UIcon
                      :name="iconKey.home"
                      class="h-6 w-6"
                    />
                  </NuxtLink>
                  <span class="text-md">/</span>
                  <span class="text-md">{{ $route.params.memo ? "Detail" : "" }}</span>
                </h1>
              </div>

              <div class="ml-auto">
                <slot name="context-menu" />
              </div>
            </div>
          </header>

          <main class="h-[calc(100%-56px)] w-full overflow-y-auto">
            <slot />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { workspace: wspace } = useWorkspace();
const { ui } = useUIState();
</script>

<style scoped>
.sidebar-area {
  border-right: 1px solid rgb(180, 187, 195);
}
</style>
