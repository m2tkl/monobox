<template>
  <div>
    <div class="h-screen w-full flex border-top">
      <!-- Sidebar -->
      <aside
        class="border-right h-full"
        :class="{ 'w-[250px] flex-shrink-0': ui.isSidebarOpen, 'hidden': !ui.isSidebarOpen }"
      >
        <!-- TODO: Since the display is toggled using hidden, control with v-if is unnecessary. -->
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
          <header class="sticky top-0 z-[100] flex h-10 w-full items-center gap-2 bg-slate-200 px-2 border-bottom">
            <div class="flex items-center gap-1 w-full text-slate-500">
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
              <span class="text-xs text-slate-800">{{ store.memo ? store.memo.title : "" }}</span>
            </div>

            <div class="ml-auto">
              <slot name="context-menu" />
            </div>
          </header>

          <main
            class="h-[calc(100%-40px)] w-full flex justify-center"
          >
            <div
              class="hide-scrollbar w-[250px] flex flex-col gap-3 flex-shrink-0 max-h-full overflow-y-auto border-right"
            >
              <slot name="side" />
            </div>

            <div
              id="main"
              class="flex-1 min-w-0 bg-slate-30 h-full overflow-y-auto hide-scrollbar"
            >
              <slot name="main" />
            </div>
          </main>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
const { ui, toggleSidebar } = useUIState();

const route = useRoute();
const workspaceSlug = computed(() => route.params.workspace as string);

const store = useWorkspaceStore();

const router = useRouter();
const goBack = () => router.go(-1);
const goNext = () => router.go(1);
const goHome = () => router.push(`/${workspaceSlug.value}`);
</script>

<style scoped>
</style>
