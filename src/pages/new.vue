<template>
  <NewMemoPage />
</template>

<script setup lang="ts">
import { NewMemoPage } from '~/app/features/memo-editing';

definePageMeta({
  path: '/:workspace/__new__',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});
</script>
