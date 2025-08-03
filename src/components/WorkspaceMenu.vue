<template>
  <!-- :popper="{ placement: 'bottom-start' }" -->
  <UDropdownMenu
    :items="workspaceMenuItems"
    :content="{
      align: 'start',
      side: 'bottom',
      sideOffset: 8,
    }"
  >
    <div class="flex items-center">
      <UButton
        :label="workspaceSlug"
        variant="subtle"
        color="neutral"
        size="sm"
        :icon="workspaceSlug ? '' : iconKey.database"
      />
    </div>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

const props = defineProps<{ workspaceSlug: string }>();

const workspaceMenuItems: DropdownMenuItem[][] = [
  [
    {
      label: 'Switch workspace',
      icon: iconKey.switch,
      to: '/',
    },
    {
      label: 'Workspace setting',
      icon: iconKey.setting,
      to: `/${props.workspaceSlug}/_setting`,
    },
    {
      label: 'App setting',
      icon: iconKey.setting,
      to: `/_setting`,
    },
  ],
];
</script>
