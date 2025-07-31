<template>
  <div
    data-tauri-drag-region
    class="titlebar gap-1"
  >
    <!-- Left section -->
    <div
      class="flex flex-1 items-center gap-1 pl-16"
      data-tauri-drag-region
    >
      <IconButton
        :icon="iconKey.menu"
        @click="toggleSidebar"
      />
    </div>

    <!-- Center section -->
    <div class="flex min-w-[calc(30%)] max-w-[360px] items-center gap-1">
      <div class="flex items-center ">
        <IconButton
          :icon="iconKey.arrowLeft"
          @click="goBack"
        />
        <IconButton
          :icon="iconKey.arrowRight"
          @click="goNext"
        />
      </div>
      <UButton
        :icon="iconKey.search"
        variant="solid"
        color="neutral"
        square
        size="xs"
        block
      >
        <span class="titlebar-search-text">
          {{ workspaceTitle || "monobox" }}
        </span>
      </UButton>
      <IconButton
        :icon="iconKey.home"
        @click="goHome"
      />
    </div>

    <!-- Right section -->
    <div class="flex-1 items-center gap-1 pr-20" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  workspaceTitle?: string;
}>();

const route = useRoute();
const router = useRouter();
const goBack = () => router.go(-1);
const goNext = () => router.go(1);
const goHome = () => router.push(`/${route.params.workspace}`);

const { toggleSidebar } = useUIState();
</script>
