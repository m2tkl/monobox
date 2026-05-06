<template>
  <AppShell>
    <template #main>
      <slot name="main" />
    </template>

    <template #actions>
      <slot name="actions" />
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '~/app/shell/AppShell.vue';
</script>
