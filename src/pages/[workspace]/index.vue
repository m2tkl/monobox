<template>
  <div>
    <UContainer>
      <div class="pt-4 pb-8">
        <!-- Memo List -->
        <ul class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          <li v-for="memo in memos" class="aspect-[1/1] overflow-hidden rounded-lg">
            <NuxtLink :to="`/${$route.params.workspace}/${memo.slug_title}`">
              <UCard class="aspect-[1/1]" :ui="{
                header: {
                  padding: 'px-3 pt-3 pb-0 sm:px-3',
                },
                body: {
                  padding: 'px-3 pb-4 pt-1 sm:p-3',
                },
                divide: 'divide-white',
              }">
                <template #header>
                  <h3 class="truncate-multiline text-sm font-semibold text-gray-700">
                    {{ truncateString(memo.title, 32) }}
                  </h3>
                </template>
                <p class="truncate-multiline text-sm text-gray-500"
                  v-for="p in truncateString(memo.description ? memo.description : '', 128)?.split('\n')">
                  {{ p }}
                </p>
              </UCard>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- New memo action button -->
      <div class="fixed bottom-10 right-10 z-50">
        <NuxtLink :to="`/${$route.params.workspace}/new`">
          <UButton icon="i-heroicons-plus" square variant="solid" size="xl" color="indigo" class="bg-slate-600" />
        </NuxtLink>
      </div>
    </UContainer>

    <div v-if="workspace && memos">
      <SearchPalette :workspace="workspace" :memos="memos" type="search" shortcut-symbol="k" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type Workspace } from '~/models/workspace';
import { type MemoIndexItem } from '~/models/memo';
import { invoke } from '@tauri-apps/api/core';
import SearchPalette from '~/components/SearchPalette.vue';

const route = useRoute()

definePageMeta({
  validate(route) {
    console.log(route.params.workspace)
    return route.params.workspace !== "settings";
  },
});

const workspace = ref<Workspace>()
const memos = ref<Array<MemoIndexItem>>()

// For command palette
const boxMemos = ref()

async function fetchWorkspace() {
  try {
    const workspaceDetail = await invoke<Workspace>('get_workspace', {
      args: { workspace_slug_name: route.params.workspace }
    })
    return workspaceDetail
  } catch (error) {
    console.error('Error fetching workspace:', error);
  }
}

async function fetchWorkspaceMemosIndex() {
  try {
    const memosIndex = await invoke<MemoIndexItem[]>('get_workspace_memos',
      { args: { workspace_slug_name: route.params.workspace, } }
    )
    return memosIndex
  } catch (error) {
    console.error('Error fetching memos:', error);
  }
}

workspace.value = await fetchWorkspace()
memos.value = await fetchWorkspaceMemosIndex()

const { setWorkspace } = useWorkspace()
onMounted(() => {
  // NOTE: To avoid a hydration mismatch with the workspace name
  // in the Heading, set the workspace after mounting.
  if (workspace.value) {
    setWorkspace(workspace.value)
  }
})

function truncateString(str: string, n: number) {
  if (!str) return;
  return str.length > n ? str.slice(0, n) : str;
}
</script>

<style scoped>
.truncate-multiline {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  /* 10行は適当な数字 */
  -webkit-line-clamp: 10;
  text-overflow: ellipsis;
  /* 固定の行数を設定せずに高さで制御する */
  line-clamp: unset;
  overflow: hidden;
}
</style>
