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
import TitleBar from '~/app/chrome/TitleBar.vue';
import ImagePreviewDialog from '~/app/features/memo/editor/ImagePreviewDialog/Index.vue';

import { emitEvent as emitEvent_ } from './resource-state/infra/eventBus';
import { startRules } from './resource-state/rules';

startRules();
useRouteWatcher();

emitEvent('app/init', undefined);
emitEvent_('app/init', undefined);
</script>
