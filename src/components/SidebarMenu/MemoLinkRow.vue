<template>
  <NuxtLink
    :to="to"
    class="block rounded-md px-2 py-1 text-sm sidebar-link"
    active-class="is-active"
    :class="{
      'sidebar-link': true,
      'is-active': active,
      'sidebar-external': external,
      'block rounded-md px-2 py-1 text-sm': true,
    }"
  >
    {{ memoTitleWithContext.memoTitle }}
    <span v-if="external">[external]</span>
    <span
      v-if="memoTitleWithContext.context"
      class="memo-link-description text-xs"
    >
      @{{ memoTitleWithContext.context }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  to: string;
  memoTitle: string;
  active?: boolean;
  external?: boolean;
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
