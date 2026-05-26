<template>
  <SearchShell>
    <template #main>
      <slot name="main" />
    </template>

    <template #actions>
      <slot name="actions" />
    </template>
  </SearchShell>
</template>

<script setup lang="ts">
import SearchShell from '~/app/scaffold/SearchShell.vue';
</script>
