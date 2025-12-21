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
import { emitEvent } from './resource-state/infra/eventBus';
import { startRules } from './resource-state/rules';

import TitleBar from '~/app/chrome/TitleBar.vue';
import ImagePreviewDialog from '~/app/features/memo/editor/ImagePreviewDialog/Index.vue';

startRules();
useRouteWatcher();

emitEvent('app/init', undefined);
</script>
