<template>
  <div data-tauri-drag-region class="titlebar gap-1">

    <!-- Left section -->
    <div class="flex-1 pl-16 flex items-center gap-1" data-tauri-drag-region>
      <IconButton :icon="iconKey.menu" @click="toggleSidebar" />
    </div>

    <!-- Center section -->
    <div class="flex items-center max-w-[360px] min-w-[calc(30%)] gap-1">
      <div class="flex items-center ">
        <IconButton :icon="iconKey.arrowLeft" @click="goBack" />
        <IconButton :icon="iconKey.arrowRight" @click="goNext" />
      </div>
      <UButton :icon="iconKey.search" variant="solid" color="gray" square size="2xs" block>
        <span class="text-gray-500">
          {{ workspaceTitle || "monobox" }}
        </span>
      </UButton>
      <IconButton :icon="iconKey.home" @click="goHome" />
    </div>

    <!-- Right section -->
    <div class="flex-1 items-center gap-1"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  workspaceTitle?: string;
}>()

const route = useRoute();
const router = useRouter();
const goBack = () => router.go(-1);
const goNext = () => router.go(1);
const goHome = () => router.push(`/${route.params.workspace}`)

const { toggleSidebar, ui } = useUIState()
</script>

<style scoped>
.titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  width: 100%;
  color: white;
  padding: 0 10px;
  user-select: none;
  overscroll-behavior: none;
  border-bottom: 1px solid rgb(180, 187, 195);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}
</style>
