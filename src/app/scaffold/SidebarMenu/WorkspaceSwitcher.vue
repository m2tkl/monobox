<template>
  <div
    v-if="workspaceSlug"
    class="workspace-switcher"
  >
    <UDropdownMenu
      :items="workspaceMenuItems"
      :content="{
        align: 'start',
        side: 'bottom',
        sideOffset: 8,
      }"
    >
      <div class="w-full">
        <AppButton
          class="workspace-switcher__trigger sidebar-link"
          variant="ghost"
          color="neutral"
          size="sm"
          block
          :aria-label="`Switch workspace from ${workspaceName || workspaceSlug}`"
        >
          <span class="workspace-switcher__content">
            <span class="workspace-switcher__name">
              {{ workspaceName || workspaceSlug }}
            </span>
            <UIcon
              :name="iconKey.chevronDown"
              class="workspace-switcher__chevron"
            />
          </span>
        </AppButton>
      </div>
    </UDropdownMenu>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

import { useTitleBarWorkspace } from '~/app/scaffold/useTitleBarWorkspace';
import { iconKey } from '~/utils/icon';

const { workspaceSlug, workspaceName } = useTitleBarWorkspace();

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
      to: `/_setting?workspace=${workspaceSlug.value}`,
    },
  ],
]);
</script>

<style scoped>
.workspace-switcher {
  padding: 0.25rem 0 0;
}

:deep(.workspace-switcher__trigger) {
  min-height: 2rem;
  padding: 0.25rem 0.5rem;
  text-align: left;
}

.workspace-switcher__content {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  gap: 0.375rem;
}

.workspace-switcher__name {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-switcher__chevron {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  opacity: 0.7;
}
</style>
