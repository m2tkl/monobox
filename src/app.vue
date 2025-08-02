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
useEventHandler();
useRouteWatcher();
useTitleUpdater();

emitEvent('app/init', undefined);
</script>
