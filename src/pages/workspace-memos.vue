<template>
  <MemoBrowsing />
</template>

<script lang="ts" setup>
import { MemoBrowsing } from '~/app/features/memo-browsing';

definePageMeta({
  path: '/:workspace',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});
</script>
