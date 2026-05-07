<template>
  <WorkspaceKanban />
</template>

<script setup lang="ts">
import { WorkspaceKanban } from '~/features/workspace-kanban';

definePageMeta({
  path: '/:workspace/_kanban',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});
</script>
