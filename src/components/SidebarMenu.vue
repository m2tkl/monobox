<template>
  <div :class="['sidebar', { 'is-open': isOpen }]" class="h-screen w-full">
    <div v-if="isOpen" class="p-4">
      <!-- Workspace section -->
      <div class="pb-2">
        <div class="flex items-center">
          <UIcon :name="iconKey.area" class="mr-1" />
          <h2 class="font-bold text-gray-600">Workspace</h2>
        </div>
      </div>

      <!-- Bookmark section -->
      <div class="pb-2">
        <div class="flex items-center">
          <UIcon :name="iconKey.bookmark" class="mr-1" />
          <h2 class="font-bold text-gray-600">Favorites</h2>
        </div>
      </div>

      <!-- Recently viewed memos section -->
      <div>
        <div class="pb-2 flex items-center">
          <UIcon :name="iconKey.recent" class="mr-1" />
          <h2 class="font-bold text-gray-600">Recent</h2>
        </div>

        <ul class="flex flex-col">
          <li v-for="memo in recentMemos" :key="memo.id"
            class="px-2 py-1 rounded-md hover:bg-slate-100 hover:text-blue-800 text-gray-600 text-sm">
            <NuxtLink :to="`/${workspaceSlug}/${memo.slug_title}`" class="block">
              {{ memo.title }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspace } from '~/composables/useWorkspace'; // 既存のuseWorkspaceがある前提
import type { MemoIndexItem } from '~/models/memo';

const isOpen = ref(true);
const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};

const { workspace } = useWorkspace();
const workspaceSlug = computed(() => workspace.value?.slug_name || '');
const command = useCommand()

const recentMemos = ref<MemoIndexItem[]>();
watch(workspaceSlug, async () => {
  if (workspaceSlug) {
    const memos = await command.memo.list({ slugName: workspaceSlug.value })
    if (memos) {
      recentMemos.value = memos
    }
  }
})
</script>

<style scoped>
.sidebar {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
  transform: translateX(-100%);
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar {
  display: none;
}

.sidebar.is-open {
  transform: translateX(0);
}
</style>
