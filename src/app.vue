<template>
  <div>
    <NuxtRouteAnnouncer />

    <UApp>
      <NuxtPage />
    </UApp>
  </div>
</template>

<script setup lang="ts">
useEventHandler();
useRouteWatcher();
useTitleUpdater();

emitEvent('app/init', undefined);
</script>
