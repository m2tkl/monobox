<template>
  <div class="border-t memo-link-container p-0">
    <!-- Link Header -->
    <div
      class="sticky left-0 top-0 z-50 flex h-8 items-center gap-2 border-b memo-separator memo-link-header px-2 py-1 text-sm font-semibold"
      style="background-color: var(--color-surface)"
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
        <li class="aspect-[1/1] rounded-lg">
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
          <NuxtLink :to="buildMemoPath(memo.slug_title)">
            <ThumbnailCard
              :title="truncateString(extractsTitleParts(memo.title).memoTitle, TITLE_TRUNCATE)"
              :context="extractsTitleParts(memo.title).context !== memoTitle ? extractsTitleParts(memo.title).context : undefined"
              :description="memo.description"
              :thumbnail-image="memo.thumbnail_image"
            />
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
                  :to="buildMemoPath(link.slug_title)"
                  class="flex flex-col"
                >
                  <TitleCard
                    :title="truncateString(extractsTitleParts(link.title).memoTitle, TITLE_TRUNCATE)"
                    :context="extractsTitleParts(link.title).context !== memoTitle ? extractsTitleParts(link.title).context : undefined"
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
                <NuxtLink :to="buildMemoPath(thl.slug_title)">
                  <ThumbnailCard
                    :title="truncateString(extractsTitleParts(thl.title).memoTitle, TITLE_TRUNCATE)"
                    :context="extractsTitleParts(thl.title).context !== link.title ? extractsTitleParts(thl.title).context : undefined"
                    :description="thl.description"
                    :thumbnail-image="thl.thumbnail_image"
                  />
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
import ThumbnailCard from './ThumbnailCard.vue';
import TitleCard from './TitleCard.vue';

import type { Link } from '~/models/link';

const props = defineProps<{
  memoTitle: string;
  links: Array<Link>;
}>();

const TITLE_TRUNCATE = 32;

const route = useRoute();
const buildMemoPath = (slug: string) => `/${route.params.workspace}/${slug}`;

const forwardLinks = computed(() =>
  props.links.filter(link => link.link_type === 'Forward'),
);
const backLinks = computed(() =>
  props.links.filter(link => link.link_type === 'Backward'),
);
const twoHopLinks = computed(() =>
  props.links.filter(link => link.link_type === 'TwoHop'),
);

function extractsTitleParts(title: string): { memoTitle: string; context: string } {
  const parts = title.split('/');
  const memoTitle = parts.pop() ?? title;
  return { memoTitle, context: parts.join('/') };
}
</script>
