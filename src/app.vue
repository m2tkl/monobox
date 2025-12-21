<template>
  <div>
    <NuxtRouteAnnouncer />

    <UApp>
      <TitleBar />
      <NuxtPage class="h-screen pt-[3rem]" />
      <ImagePreviewDialog />
    </UApp>
  </div>
</template>

<script setup lang="ts">
import { bootstrapResourceState } from './resource-state/index';

import TitleBar from '~/app/chrome/TitleBar.vue';
import ImagePreviewDialog from '~/app/features/memo/editor/ImagePreviewDialog/Index.vue';

bootstrapResourceState();
</script>
