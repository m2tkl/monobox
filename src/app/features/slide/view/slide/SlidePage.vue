<!-- eslint-disable vue/no-v-html -->
<template>
  <NuxtLayout name="default">
    <template #main>
      <Slide :html="slidesHtml" />
    </template>

    <template #actions>
      <div class="fixed bottom-6 right-6 z-50 flex gap-2">
        <AppButton
          :icon="iconKey.arrowLeft"
          color="neutral"
          variant="soft"
          @click="$router.go(-1)"
        >
          Exit
        </AppButton>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import Slide from './Slide.vue';
import { useSlidePage } from './useSlidePage';

import { iconKey } from '~/utils/icon';

const { slidesHtml, loadInitialData } = useSlidePage();

await usePageLoader(loadInitialData);
</script>
