<template>
  <div class="border-t border-slate-300 p-0">
    <!-- Link Header -->
    <div
      class="sticky left-0 top-0 z-50 flex h-8 items-center gap-2 border-b-2 border-slate-400 bg-surface px-2 py-1 text-sm font-semibold text-gray-800"
    >
      <UIcon :name="iconKey.link" />
      Links
    </div>

    <!-- Backlinks -->
    <div
      v-if="backLinks.length !== 0"
      class="my-4"
    >
      <ul class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-4">
        <li>
          <TitleCard
            title="Links"
            card-type="text"
          />
        </li>

        <li
          v-for="memo in backLinks"
          :key="memo.id"
          class="aspect-[1/1] overflow-hidden rounded-lg"
        >
          <NuxtLink :to="`/${route.params.workspace}/${memo.slug_title}`">
            <UCard
              class="aspect-[1/1] hover:bg-slate-100"
              :ui="{
                header: 'px-3 pt-3 pb-0 sm:px-3',
                body: 'px-3 pb-4 pt-1 sm:p-3',
                root: 'divide-white hover:divide-slate-100',
              }"
            >
              <template #header>
                <h3 class="truncate-multiline text-sm font-semibold text-gray-700">
                  {{ truncateString(extractBasenameFromTitle(memo.title), 32) }}
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

    <!-- Forward links -->
    <div>
      <div v-if="forwardLinks.length !== 0">
        <ul class="flex flex-col gap-0">
          <li
            v-for="link in forwardLinks"
            :key="link.link_id"
          >
            <!-- Direct forward link -->
            <ul class="my-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-4">
              <li class="aspect-[1/1] overflow-hidden rounded-lg ">
                <NuxtLink
                  :to="`/${route.params.workspace}/${link.slug_title}`"
                  class="flex flex-col"
                >
                  <TitleCard
                    :title="truncateString(extractBasenameFromTitle(link.title), 32)"
                    card-type="link"
                  />
                </NuxtLink>
              </li>

              <!-- 2hop-link -->
              <li
                v-for="thl in twoHopLinks.filter(
                  (thl) => thl.link_id === link.link_id,
                )"
                :key="thl.link_id"
                class="aspect-[1/1] overflow-hidden rounded-lg"
              >
                <NuxtLink :to="`/${route.params.workspace}/${thl.slug_title}`">
                  <UCard
                    class="aspect-[1/1] hover:bg-slate-100"
                    :ui="{
                      header: 'px-3 pt-3 pb-0 sm:px-3',
                      body: 'px-3 pb-4 pt-1 sm:p-3',
                      root: 'divide-white hover:divide-slate-100',
                    }"
                  >
                    <template #header>
                      <h3 class="truncate-multiline text-sm font-semibold text-gray-700">
                        {{ truncateString(extractBasenameFromTitle(thl.title), 32) }}
                      </h3>
                    </template>
                    <img
                      v-if="thl.thumbnail_image"
                      :src="transformImageSrc(thl.thumbnail_image)"
                    >
                    <p
                      v-for="p in truncateString(thl.description ? thl.description : '', 128)?.split('\n')"
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
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TitleCard from './TitleCard.vue';

import type { Link } from '~/models/link';

const props = defineProps<{
  links: Array<Link>;
}>();

function extractBasenameFromTitle(title: string): string {
  return title.includes('/') ? title.split('/').pop() ?? title : title;
}

const route = useRoute();

const forwardLinks = computed(() =>
  props.links.filter(link => link.link_type === 'Forward'),
);
const backLinks = computed(() =>
  props.links.filter(link => link.link_type === 'Backward'),
);
const twoHopLinks = computed(() =>
  props.links.filter(link => link.link_type === 'TwoHop'),
);
</script>
