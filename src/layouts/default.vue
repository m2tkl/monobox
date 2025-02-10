<template>
  <div>
    <div class="h-[calc(100vh-1px)] w-full flex top-border">
      <!-- Sidebar -->
      <aside
        class="sidebar-area h-[calc(100vh-1px)] overflow-auto"
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
          <header class="sticky top-0 z-50 flex h-10 items-center gap-2 bg-slate-200 px-2 bottom-border">
            <!-- Workspace/**  -->
            <div
              v-if="route.params.workspace"
              class="flex items-center w-full"
            >
              <div class="flex items-center gap-2.5 w-full">
                <div class=" text-slate-500 gap-1 flex items-center w-full">
                  <IconButton
                    v-if="!ui.isSidebarOpen"
                    :icon="iconKey.sidebarOpen"
                    @click="toggleSidebar"
                  />

                  <WorkspaceMenu
                    v-if="!ui.isSidebarOpen"
                    :workspace-slug="workspaceSlug"
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

                  <span class="text-xs">/</span>
                </div>
              </div>

              <div class="ml-auto">
                <slot name="context-menu" />
              </div>
            </div>
          </header>

          <main
            id="main"
            class="h-[calc(100%-40px)] w-full overflow-y-auto"
          >
            <slot />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { ui, toggleSidebar } = useUIState();

const route = useRoute();
const workspaceSlug = computed(() => route.params.workspace as string);

const router = useRouter();
const goBack = () => router.go(-1);
const goNext = () => router.go(1);
const goHome = () => router.push(`/${workspaceSlug.value}`);
</script>

<style scoped>
.top-border {
  border-top: 1px solid rgb(180, 187, 195);
}

.bottom-border {
  border-bottom: 1px solid rgb(180, 187, 195);
}

.sidebar-area {
  border-right: 1px solid rgb(180, 187, 195);
}
</style>
