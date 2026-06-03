<template>
  <WorkspaceCalendar />
</template>

<script setup lang="ts">
import { WorkspaceCalendar } from '~/app/features/workspace-calendar';

definePageMeta({
  path: '/:workspace/_calendar',
});
</script>
