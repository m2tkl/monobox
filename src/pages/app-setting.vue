<template>
  <WorkspaceSettingsPage />
</template>

<script setup lang="ts">
import { WorkspaceSettingsPage } from '~/app/features/workspace-settings';

definePageMeta({
  path: '/_setting',
  layout: false,
});
</script>
