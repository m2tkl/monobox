<template>
  <ManagedFilePage />
</template>

<script setup lang="ts">
import { ManagedFilePage } from '~/app/features/files';

definePageMeta({
  path: '/:workspace/_files/:fileId',
});
</script>
