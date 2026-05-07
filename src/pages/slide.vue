<template>
  <SlidePage />
</template>

<script setup lang="ts">
import { SlidePage } from '~/features/slide';

definePageMeta({
  path: '/:workspace/:memo/_slide',
});
</script>
