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

<style>
html,
body {
  background-color: rgb(226 232 240);
  /* Disable bounce */
  overscroll-behavior: none;
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
  overscroll-behavior: none;
}

/* Utilities */

/* Utilities > border */
.border-top {
  border-top: 1px solid rgb(180, 187, 195);
}

.border-bottom {
  border-bottom: 1px solid rgb(180, 187, 195);
}

.border-left {
  border-left: 1px solid rgb(180, 187, 195);
}

.border-right {
  border-right: 1px solid rgb(180, 187, 195);
}

/* Utilities > scrollbar */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Utilities > behavior */
.disable-bounce {
  overscroll-behavior: none;
}

/* Scrollbar customize */
/* Webkit（Chrome, Edge, Safai etc...） */
::-webkit-scrollbar {
  /* For vertical scrollbar */
  width: 6px;
  /* For horizontal scrollbar */
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(73, 73, 73, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(83, 83, 83, 0.3);
}
</style>
