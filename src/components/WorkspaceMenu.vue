<template>
  <UDropdownMenu
    :items="workspaceMenuItems"
    :popper="{ placement: 'bottom-start' }"
  >
    <div class="flex items-center">
      <span class="text-md font-bold sidebar-heading">
        {{ workspaceSlug }}
      </span>
      <UIcon
        :name="iconKey.chevronDown"
        class="ml-1"
        size="2xs"
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
