<template>
  <FilesPage />
</template>

<script setup lang="ts">
import { FilesPage } from '~/features/files';

definePageMeta({
  path: '/:workspace/_files',
});
</script>
