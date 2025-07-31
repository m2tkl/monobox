<template>
  <div class="border-x border-t memo-link-list-container p-0">
    <!-- Link Header -->
    <div
      class="sticky left-0 top-0 z-50 flex items-center gap-2 border-b-2 memo-link-list-header px-2 py-1 text-sm font-semibold"
    >
      <UIcon :name="iconKey.link" />
      Links
    </div>

    <!-- Backlinks -->
    <div v-if="backLinks.length !== 0">
      <ul class="flex flex-col">
        <li
          v-for="link in backLinks"
          :key="link.link_id"
        >
          <div
            class="border-b memo-link-list-item px-2 py-0.5 text-sm"
          >
            <NuxtLink
              :to="`/${$route.params.workspace}/${link.slug_title}`"
              class="flex flex-col"
            >
              <span
                v-if="previousRoute?.params.memo === link.title"
                class="text-xs font-semibold"
              >[From]
              </span>
              {{ extractBasenameFromTitle(link.title) }}
            </NuxtLink>
          </div>
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
              class="border-b-2 memo-link-list-forward px-2 py-0.5 text-sm"
            >
              <NuxtLink
                :to="`/${$route.params.workspace}/${link.slug_title}`"
                class="flex flex-col"
              >
                <span
                  v-if="previousRoute?.params.memo === link.title"
                  class="text-xs font-bold"
                >[From]
                </span>
                {{ extractBasenameFromTitle(link.title) }}
              </NuxtLink>
            </div>

            <!-- 2hop-link -->
            <ul>
              <li
                v-for="thl in twoHopLinks.filter(
                  (thl) => thl.link_id === link.link_id,
                )"
                :key="thl.link_id"
              >
                <div
                  class="border-b memo-link-list-item px-2 py-0.5 text-sm"
                >
                  <NuxtLink
                    :to="`/${$route.params.workspace}/${thl.slug_title}`"
                    class="flex flex-col"
                  >
                    <span
                      v-if="previousRoute?.params.memo === thl.title"
                      class="text-xs font-bold"
                    >[From]
                    </span>
                    {{ extractBasenameFromTitle(thl.title) }}
                  </NuxtLink>
                </div>
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

function extractBasenameFromTitle(title: string): string {
  return title.includes('/') ? title.split('/').pop() ?? title : title;
}

const previousRoute = usePreviousRoute();

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
