<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="size-full">
        <div class="size-full px-4 pb-8 pt-4">
          <!-- Memo List -->
          <p v-if="memos && memos.length === 0">
            No memos
          </p>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 pb-4">
            <li
              v-for="memo in memos"
              :key="memo.id"
              class="aspect-[1/1] overflow-hidden rounded-lg"
            >
              <NuxtLink :to="`/${route.params.workspace}/${memo.slug_title}`">
                <UCard
                  class="aspect-[1/1] hover:bg-slate-100"
                  :ui="{
                    header: 'px-3 pt-3 pb-0 sm:px-3 divide-white',
                    body: 'px-3 pb-4 pt-1 sm:p-3 divide-white',
                    root: 'divide-white hover:divide-slate-100',
                  }"
                >
                  <template #header>
                    <h3 class="truncate-multiline text-sm font-semibold text-gray-700">
                      {{ truncateString(memo.title, 32) }}
                    </h3>
                  </template>
                  <img
                    v-if="memo.thumbnail_image"
                    :src="transformImageSrc(memo.thumbnail_image)"
                  >
                  <p
                    v-for="p in truncateString(memo.description ? memo.description : '', 128)?.split('\n')"
                    v-else
                    :key="p"
                    class="truncate-multiline text-sm text-gray-500"
                  >
                    {{ p }}
                  </p>
                </UCard>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #actions>
      <!-- New memo action button -->
      <div class="fixed bottom-10 right-10 z-50">
        <NuxtLink :to="`/${route.params.workspace}/new`">
          <UButton
            :icon="iconKey.add"
            square
            variant="solid"
            size="xl"
            class="bg-slate-600"
          />
        </NuxtLink>
      </div>

      <div v-if="workspace && memos">
        <SearchPalette
          :workspace="workspace"
          :memos="memos"
          type="search"
          shortcut-symbol="k"
        />
      </div>
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import type { MemoIndexItem } from '~/models/memo';
import type { Workspace } from '~/models/workspace';

import SearchPalette from '~/components/SearchPalette.vue';

definePageMeta({
  path: '/:workspace',
});

const route = useRoute();
const command = useCommand();

definePageMeta({
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});

const workspace = ref<Workspace>();
const memos = ref<Array<MemoIndexItem>>();

async function fetchWorkspace() {
  try {
    const workspaceDetail = await command.workspace.get({ slugName: route.params.workspace as string });
    return workspaceDetail;
  }
  catch (error) {
    console.error('Error fetching workspace:', error);
  }
}

async function fetchWorkspaceMemosIndex() {
  try {
    const memosIndex = await command.memo.list({ slugName: route.params.workspace as string });
    return memosIndex;
  }
  catch (error) {
    console.error('Error fetching memos:', error);
  }
}

workspace.value = await fetchWorkspace();
memos.value = await fetchWorkspaceMemosIndex();

const { setWorkspace } = useWorkspace();
onMounted(() => {
  // NOTE: To avoid a hydration mismatch with the workspace name
  // in the Heading, set the workspace after mounting.
  if (workspace.value) {
    setWorkspace(workspace.value);
  }
});
</script>

<style scoped>
.truncate-multiline {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  /* 10 lines is just an arbitrary number that seemed reasonable. */
  -webkit-line-clamp: 10;
  text-overflow: ellipsis;
  /* Control the layout using height instead of setting a fixed number of lines */
  line-clamp: unset;
  overflow: hidden;
}
</style>
