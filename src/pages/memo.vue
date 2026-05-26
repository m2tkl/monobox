<template>
  <MemoEditing />
</template>

<script setup lang="ts">
import { MemoEditing } from '~/app/features/memo-editing';

definePageMeta({
  path: '/:workspace/:memo',
  validate(route) {
    return route.params.memo !== '_settings';
  },
});
</script>
