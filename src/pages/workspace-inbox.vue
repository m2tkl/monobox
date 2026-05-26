<template>
  <InboxPage />
</template>

<script setup lang="ts">
import { InboxPage } from '~/app/features/files';

definePageMeta({
  path: '/:workspace/_inbox',
});
</script>
