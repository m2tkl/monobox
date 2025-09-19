<template>
  <div>
    <NuxtRouteAnnouncer />

    <UApp>
      <TitleBar />
      <NuxtPage class="h-screen pt-[3rem]" />
    </UApp>
  </div>
</template>

<script setup lang="ts">
import { emitEvent as emitEvent_ } from './resource-state/infra/eventBus';
import { startRules } from './resource-state/rules';

startRules();
useRouteWatcher();

emitEvent('app/init', undefined);
emitEvent_('app/init', undefined);
</script>
