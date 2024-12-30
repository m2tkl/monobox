<template>
  <div class="border-x border-t border-slate-300 bg-slate-100 p-0">
    <!-- Link Header -->
    <div
      class="flex items-center gap-2 border-b-2 border-slate-400 bg-slate-300 px-2 py-1 text-sm font-semibold text-gray-800"
    >
      <UIcon :name="iconKey.link" />
      Links
    </div>

    <!-- Backlinks -->
    <div v-if="backLinks.length !== 0">
      <ul class="flex flex-col">
        <li v-for="link in backLinks">
          <div
            class="border-b border-slate-300 bg-slate-50 px-2 py-0.5 text-sm text-gray-700 hover:bg-slate-200 hover:text-gray-900"
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
              {{ link.title }}
            </NuxtLink>
          </div>
        </li>
      </ul>
    </div>

    <!-- Forward links -->
    <div>
      <div v-if="forwardLinks.length !== 0">
        <ul class="flex flex-col gap-0">
          <li v-for="link in forwardLinks">
            <!-- Direct forward link -->
            <div
              class="border-b-2 border-blue-500 bg-blue-200 px-2 py-0.5 text-sm font-semibold text-gray-700 hover:bg-blue-300 hover:text-gray-800"
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
                {{ link.title }}
              </NuxtLink>
            </div>

            <!-- 2hop-link -->
            <ul>
              <li
                v-for="thl in twoHopLinks.filter(
                  (thl) => thl.link_id === link.link_id
                )"
              >
                <div
                  class="border-b border-slate-300 bg-slate-50 px-2 py-0.5 text-sm text-gray-700 hover:bg-slate-200 hover:text-gray-900"
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
                    {{ thl.title }}
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
import { type Link } from '~/models/link';

const props = defineProps<{
  links: Array<Link>;
}>();

const previousRoute = usePreviousRoute();

const forwardLinks = computed(() =>
  props.links.filter((link) => link.link_type === "Forward")
);
const backLinks = computed(() =>
  props.links.filter((link) => link.link_type === "Backward")
);
const twoHopLinks = computed(() =>
  props.links.filter((link) => link.link_type === "TwoHop")
);
</script>
