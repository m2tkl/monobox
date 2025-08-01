<template>
  <div>
    <div class="border-top flex h-screen w-full overflow-hidden">
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
          <header
            class="border-bottom sticky top-0 z-[100] flex h-10 w-full items-center gap-2 px-2 min-w-0"
            style="background-color: var(--color-background)"
          >
            <div
              class="flex w-full items-center gap-1"
              style="color: var(--color-text-secondary)"
            >
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
              <div class="text-xs w-full truncate">
                <span style="color: var(--color-text-primary)">{{ memoTitleSlug }}</span>
                <span
                  class="ml-2"
                  style="color: var(--color-text-muted)"
                >{{ route.hash }}</span>
              </div>
            </div>

            <div class="ml-auto">
              <div class="flex gap-1.5 items-center">
                <slot name="context-menu" />
              </div>
            </div>
          </header>

          <!--
            NOTE:
            - 40px: header height
          -->
          <main
            class="h-[calc(100%-40px)] w-full overflow-y-auto"
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
const { ui, toggleSidebar } = useUIState();

const route = useRoute();
const workspaceSlug = computed(() => route.params.workspace as string);
const memoTitleSlug = computed(() => route.params.memo as string);

const router = useRouter();
const goBack = () => router.go(-1);
const goNext = () => router.go(1);
const goHome = () => router.push(`/${workspaceSlug.value}`);
</script>

<style scoped>
</style>
