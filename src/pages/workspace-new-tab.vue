<template>
  <NewTabPage />
</template>

<script setup lang="ts">
import { NewTabPage } from '~/app/features/workspace-start';

definePageMeta({
  path: '/:workspace/_new-tab',
});
</script>
