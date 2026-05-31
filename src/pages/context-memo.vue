<template>
  <ContextWindowPage />
</template>

<script setup lang="ts">
import ContextWindowPage from '~/app/features/memo-editing/view/context-view/ContextWindowPage.vue';

definePageMeta({
  path: '/:workspace/:memo/_context',
});
</script>
