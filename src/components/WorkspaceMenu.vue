<template>
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
        :label="workspaceName"
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

const props = defineProps<{
  workspaceSlug: string;
  workspaceName: string;
}>();

const workspaceMenuItems: ComputedRef<DropdownMenuItem[][]> = computed(() => [
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
  ],
]);
</script>
