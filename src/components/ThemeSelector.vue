<template>
  <UDropdownMenu
    :items="menuItems"
    :popper="{ placement: 'bottom-start' }"
  >
    <UButton
      variant="ghost"
      :icon="currentTheme.config.icon"
      :label="currentTheme.config.name"
      trailing-icon="i-heroicons-chevron-down-20-solid"
      size="sm"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

const { currentTheme, availableThemes, setTheme } = useTheme();

const menuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: 'Color Theme',
    slot: 'header',
  },
  ...availableThemes.value.map(theme => ({
    label: theme.name,
    icon: theme.icon,
    description: theme.description,
    active: theme.active,
    onSelect: () => setTheme(theme.mode),
  })),
]);
</script>
