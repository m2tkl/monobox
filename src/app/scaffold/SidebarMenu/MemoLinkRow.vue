<template>
  <NuxtLink
    :to="to"
    class="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm sidebar-link"
    :active-class="active === undefined ? 'is-active' : ''"
    :class="{
      'sidebar-link': true,
      'is-active': active,
      'sidebar-external': external,
      'flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm': true,
    }"
  >
    <span class="sidebar-memo-link__main">
      <AppIcon
        v-if="icon"
        :name="icon"
        class="sidebar-memo-link__icon"
      />
      <SidebarMemoLabel
        :title="memoTitle"
        :external="external"
      />
    </span>
    <span
      v-if="count !== undefined"
      class="shrink-0 text-xs text-gray-500"
    >{{ count }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import SidebarMemoLabel from './SidebarMemoLabel.vue';

import AppIcon from '~/app/elements/AppIcon.vue';

defineProps<{
  to: string;
  memoTitle: string;
  icon?: string;
  active?: boolean;
  external?: boolean;
  count?: number;
}>();
</script>

<style scoped>
.sidebar-memo-link__main {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-memo-link__icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}
</style>
