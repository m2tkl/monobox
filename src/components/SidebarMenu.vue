<template>
  <div v-if="isOpen" class="h-full w-full">
    <div class="p-4 h-full w-full">
      <!-- Workspace section -->
      <!-- <div class="pb-3 sticky top-0 z-10"> -->
      <div class="pb-3 h-10">
        <UDropdown :items="workspaceMenuItems" :popper="{ placement: 'bottom-start' }" class="border">
          <div class="flex items-center">
            <UIcon :name="iconKey.database" class="mr-1" />
            <span class="font-bold text-gray-600 text-lg">
              {{ workspaceSlug }}
            </span>
            <UIcon :name="iconKey.chevronDown" class="ml-1" size="xs" />
          </div>
        </UDropdown>
      </div>

      <div class="h-[calc(100%-2.5rem)] overflow-y-auto">

        <!-- Bookmark section -->
        <!-- 🚧 TODO: Implement bookmark feature -->
        <!-- <section>
          <div class="sticky top-0 z-10 bg-[--slate]">
            <div class="pb-2 flex items-center">
              <UIcon :name="iconKey.bookmark" class="mr-1" />
              <h2 class="font-bold text-gray-600">Favorites</h2>
            </div>
          </div>
        </section> -->

        <!-- Recently viewed memos section -->
        <section>
          <div class="sticky top-0 z-10 bg-[--slate]">
            <div class="pb-2 flex items-center">
              <UIcon :name="iconKey.recent" class="mr-1" />
              <h2 class="font-bold text-gray-600">Recent</h2>
              <USelect v-model="sortTypeSelected" :options="recentMenuItems" variant="none" class="text-gray-500" />
            </div>
          </div>

          <ul class="flex flex-col">
            <li v-for="memo in recentMemos" :key="memo.id">
              <NuxtLink :to="`/${workspaceSlug}/${memo.slug_title}`"
                class="block px-2 py-1 rounded-md hover:bg-slate-100 hover:text-blue-700 text-gray-600 text-sm"
                active-class="bg-slate-100 font-bold">
                {{ memo.title }}
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspace } from '~/composables/useWorkspace'; // 既存のuseWorkspaceがある前提
import type { MemoIndexItem } from '~/models/memo';

const router = useRouter()
const route = useRoute()

defineProps<{ isOpen: boolean }>()

const { workspace } = useWorkspace();
const workspaceSlug = computed(() => workspace.value?.slug_name || '');
const command = useCommand()

const recentMemos = ref<MemoIndexItem[]>();
watch([workspaceSlug, route], async () => {
  if (workspaceSlug) {
    const memos = await command.memo.list({ slugName: workspaceSlug.value })
    if (memos) {
      recentMemos.value = memos
    }
  }
})

const workspaceMenuItems = [
  [
    {
      label: 'Switch workspace',
      icon: iconKey.switch,
      click: () => {
        router.push("/")
      }
    }
  ]
]

const recentMenuItems = [
  'Modified',
]
const sortTypeSelected = ref(recentMenuItems[0])
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
