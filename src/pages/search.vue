<template>
  <SearchPage />
</template>

<script setup lang="ts">
import { SearchPage } from '~/features/search';

definePageMeta({
  path: '/:workspace/_search',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});
</script>
