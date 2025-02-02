<template>
  <div class="border-t border-slate-300 p-0">
    <!-- Link Header -->
    <div
      class="sticky top-0 left-0 z-50 flex items-center gap-2 border-b-2 border-slate-400 bg-slate-300 px-2 py-1 text-sm font-semibold text-gray-800 mb-4"
    >
      <UIcon :name="iconKey.link" />
      Links
    </div>

    <!-- Backlinks -->
    <div v-if="backLinks.length !== 0">
      <ul class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 pb-4">
        <li
          v-for="memo in backLinks"
          :key="memo.id"
          class="aspect-[1/1] overflow-hidden rounded-lg"
        >
          <NuxtLink :to="`/${route.params.workspace}/${memo.slug_title}`">
            <UCard
              class="aspect-[1/1]"
              :ui="{
                header: {
                  padding: 'px-3 pt-3 pb-0 sm:px-3',
                },
                body: {
                  padding: 'px-3 pb-4 pt-1 sm:p-3',
                },
                divide: 'divide-white',
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

    <!-- Forward links -->
    <div>
      <div v-if="forwardLinks.length !== 0">
        <ul class="flex flex-col gap-0">
          <li
            v-for="link in forwardLinks"
            :key="link.link_id"
          >
            <!-- Direct forward link -->
            <div
              class="border-b-2 border-blue-500 bg-blue-200 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-blue-300 hover:text-gray-800  sticky top-[28px] left-0 z-40"
            >
              <NuxtLink
                :to="`/${route.params.workspace}/${link.slug_title}`"
                class="flex flex-col"
              >
                {{ link.title }}
              </NuxtLink>
            </div>

            <ul class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 my-4">
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
                    class="aspect-[1/1]"
                    :ui="{
                      header: {
                        padding: 'px-3 pt-3 pb-0 sm:px-3',
                      },
                      body: {
                        padding: 'px-3 pb-4 pt-1 sm:p-3',
                      },
                      divide: 'divide-white',
                    }"
                  >
                    <template #header>
                      <h3 class="truncate-multiline text-sm font-semibold text-gray-700">
                        {{ truncateString(thl.title, 32) }}
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
import type { Link } from '~/models/link';

const props = defineProps<{
  links: Array<Link>;
}>();

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
