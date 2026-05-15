<template>
  <NuxtLink
    :to="to"
    class="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm sidebar-link"
    active-class="is-active"
    :class="{
      'sidebar-link': true,
      'is-active': active,
      'sidebar-external': external,
      'flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm': true,
    }"
  >
    <span class="min-w-0 flex-1">
      <span class="block truncate">
        {{ memoTitleWithContext.memoTitle }}
        <span v-if="external">[external]</span>
      </span>
      <span
        v-if="memoTitleWithContext.context"
        class="memo-link-description block truncate text-xs"
      >
        @{{ memoTitleWithContext.context }}
      </span>
    </span>
    <span class="shrink-0 text-xs text-gray-500">{{ count }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  to: string;
  memoTitle: string;
  active?: boolean;
  external?: boolean;
  count?: number;
}>();

const memoTitleWithContext = computed(() => {
  return extractsTitleParts(props.memoTitle);
});

function extractsTitleParts(title: string): { memoTitle: string; context: string } {
  const parts = title.split('/');
  const memoTitle = parts.pop() ?? title;
  return { memoTitle, context: parts.join('/') };
}
</script>
