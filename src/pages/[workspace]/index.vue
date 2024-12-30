<template>
  <div>
    <UContainer>
      <div class="pt-4 pb-8">
        <!-- Memo List -->
        <p v-if="memos && memos.length === 0">No memos</p>
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
          <UButton :icon="iconKey.add" square variant="solid" size="xl" color="indigo" class="bg-slate-600" />
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
import SearchPalette from '~/components/SearchPalette.vue';

const route = useRoute()
const command = useCommand()

definePageMeta({
  validate(route) {
    return route.params.workspace !== "_setting";
  },
});

const workspace = ref<Workspace>()
const memos = ref<Array<MemoIndexItem>>()

async function fetchWorkspace() {
  try {
    const workspaceDetail = await command.workspace.get({ slugName: route.params.workspace as string })
    return workspaceDetail
  } catch (error) {
    console.error('Error fetching workspace:', error);
  }
}

async function fetchWorkspaceMemosIndex() {
  try {
    const memosIndex = await command.memo.list({slugName: route.params.workspace as string})
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
