<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="size-full">
        <div class="size-full px-4 pb-8 overflow-y-auto">
          <!-- Memo List -->
          <LoadingSpinner v-if="workspaceMemosLoading" />
          <p v-else-if="memos.length === 0">
            No memos
          </p>

          <section v-if="bookmarks.length > 0">
            <div class="sticky top-0 z-10 bg-surface">
              <div class="flex h-12 items-center">
                <UIcon
                  :name="iconKey.bookmark"
                  class="mr-2"
                />
                <h2 class="font-bold text-gray-600">
                  Bookmarks
                </h2>
              </div>
            </div>

            <ul class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              <li
                v-for="memo in bookmarks"
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
          </section>

          <div class="sticky top-0 z-10 bg-surface">
            <div class="flex h-12 items-center">
              <UIcon
                :name="iconKey.recent"
                class="mr-2"
              />
              <h2 class="font-bold text-gray-600">
                Recent
              </h2>
            </div>
          </div>

          <ul class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            <li
              v-for="memo in recentMemos"
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
import SearchPalette from '~/components/SearchPalette.vue';

definePageMeta({
  path: '/:workspace',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});

const route = useRoute();
const store = useWorkspaceStore();

const workspace = computed(() => store.workspace);
const memos = computed(() => store.workspaceMemos);
const workspaceMemosLoading = computed(() => store.workspaceMemosLoading);

const recentMemos = computed(() => {
  return store.workspaceMemos.filter(memo => !store.bookmarkedMemos.map(item => item.title).includes(memo.title));
});
const bookmarks = computed(() => store.bookmarkedMemos);
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
