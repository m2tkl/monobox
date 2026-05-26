<template>
  <FilesPage />
</template>

<script setup lang="ts">
import { FilesPage } from '~/app/features/files';

definePageMeta({
  path: '/:workspace/_files',
});
</script>
