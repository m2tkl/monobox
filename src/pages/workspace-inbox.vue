<template>
  <InboxPage />
</template>

<script setup lang="ts">
import { InboxPage } from '~/features/files';

definePageMeta({
  path: '/:workspace/_inbox',
});
</script>
