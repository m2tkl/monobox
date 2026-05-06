<template>
  <nav class="activity-bar border-right">
    <div class="activity-bar-group">
      <ActivityBarItem
        v-for="item in topItems"
        :key="item.id"
        :label="item.label"
        :icon="item.icon"
        :to="item.to"
        :active="isItemActive(item)"
      />
    </div>

    <div class="activity-bar-group activity-bar-group--bottom">
      <ActivityBarItem
        v-for="item in bottomItems"
        :key="item.id"
        :label="item.label"
        :icon="item.icon"
        :to="item.to"
        :active="isItemActive(item)"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import ActivityBarItem from './ActivityBarItem.vue';

import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

type ActivityBarItemConfig = {
  id: string;
  label: string;
  icon: string;
  to: string;
  group?: 'top' | 'bottom';
  activeRule?: {
    matchAll?: boolean;
    workspaceRequired?: boolean;
    pathEquals?: string[];
    pathStartsWith?: string[];
    excludeEquals?: string[];
    excludeStartsWith?: string[];
  };
};

const props = defineProps<{
  items?: ActivityBarItemConfig[];
}>();

const route = useRoute();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route));

const mainRoute = computed(() => workspaceSlug.value ? `/${workspaceSlug.value}` : '/');
const kanbanRoute = computed(() => workspaceSlug.value ? `/${workspaceSlug.value}/_kanban` : '/');
const searchRoute = computed(() => workspaceSlug.value ? `/${workspaceSlug.value}/_search` : '/');
const settingsRoute = computed(() => workspaceSlug.value ? `/_setting?workspace=${workspaceSlug.value}` : '/_setting');

const defaultItems = computed<ActivityBarItemConfig[]>(() => ([
  {
    id: 'main',
    label: 'Main',
    icon: iconKey.home,
    to: mainRoute.value,
    activeRule: {
      matchAll: true,
      workspaceRequired: true,
      excludeEquals: [
        '/_setting',
        searchRoute.value,
        kanbanRoute.value,
      ],
    },
  },
  {
    id: 'kanban',
    label: 'Kanban',
    icon: iconKey.area,
    to: kanbanRoute.value,
    activeRule: {
      pathEquals: [kanbanRoute.value],
    },
  },
  {
    id: 'search',
    label: 'Search',
    icon: iconKey.search,
    to: searchRoute.value,
    activeRule: {
      pathEquals: [searchRoute.value],
    },
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: iconKey.setting,
    to: settingsRoute.value,
    group: 'bottom',
    activeRule: {
      pathEquals: ['/_setting'],
    },
  },
]));

const items = computed(() => (props.items && props.items.length > 0 ? props.items : defaultItems.value));
const topItems = computed(() => items.value.filter(item => item.group !== 'bottom'));
const bottomItems = computed(() => items.value.filter(item => item.group === 'bottom'));

const resolvePaths = (paths: string[] | undefined): string[] => {
  if (!paths) return [];
  return paths
    .map((path) => {
      if (path.includes(':workspace')) {
        if (!workspaceSlug.value) return null;
        return path.replace(':workspace', workspaceSlug.value);
      }
      return path;
    })
    .filter((path): path is string => !!path);
};

const matchesAny = (paths: string[], matcher: (path: string) => boolean): boolean => {
  return paths.some(path => matcher(path));
};

const isItemActive = (item: ActivityBarItemConfig): boolean => {
  const rule = item.activeRule;
  if (!rule) {
    return route.path === item.to;
  }

  if (rule.workspaceRequired && !workspaceSlug.value) {
    return false;
  }

  const excludeEquals = resolvePaths(rule.excludeEquals);
  const excludeStartsWith = resolvePaths(rule.excludeStartsWith);
  if (matchesAny(excludeEquals, path => route.path === path)) return false;
  if (matchesAny(excludeStartsWith, path => route.path.startsWith(path))) return false;

  if (rule.matchAll) {
    return true;
  }

  const pathEquals = resolvePaths(rule.pathEquals);
  const pathStartsWith = resolvePaths(rule.pathStartsWith);
  if (matchesAny(pathEquals, path => route.path === path)) return true;
  if (matchesAny(pathStartsWith, path => route.path.startsWith(path))) return true;

  return false;
};
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
