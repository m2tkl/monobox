<template>
  <nav class="activity-bar border-right">
    <div class="activity-bar-group">
      <ActivityBarItem
        label="Main"
        :icon="iconKey.home"
        :to="mainRoute"
        :active="isMainActive"
      />
      <ActivityBarItem
        label="Search"
        :icon="iconKey.search"
        :to="searchRoute"
        :active="isSearchActive"
      />
    </div>

    <div class="activity-bar-group activity-bar-group--bottom">
      <ActivityBarItem
        label="Settings"
        :icon="iconKey.setting"
        to="/_setting"
        :active="isSettingsActive"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import ActivityBarItem from './ActivityBarItem.vue';

import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const route = useRoute();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route));

const mainRoute = computed(() => workspaceSlug.value ? `/${workspaceSlug.value}` : '/');
const searchRoute = computed(() => workspaceSlug.value ? `/${workspaceSlug.value}/_search` : '/');
const isSettingsActive = computed(() => route.path === '/_setting');
const isSearchActive = computed(() => !!workspaceSlug.value && route.path === searchRoute.value);
const isMainActive = computed(() => !!workspaceSlug.value && !isSettingsActive.value && !isSearchActive.value);
</script>

<style scoped>
.activity-bar {
  display: flex;
  flex-direction: column;
  width: 56px;
  height: 100%;
  flex-shrink: 0;
  background-color: var(--color-surface);
}

.activity-bar-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px;
}

.activity-bar-group--bottom {
  margin-top: auto;
  padding-bottom: 12px;
}
</style>
