<template>
  <MemoBrowsing />
</template>

<script setup lang="ts">
import { MemoBrowsing } from '~/app/features/memo-browsing';

definePageMeta({
  path: '/:workspace/_bookmarks',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});
</script>
