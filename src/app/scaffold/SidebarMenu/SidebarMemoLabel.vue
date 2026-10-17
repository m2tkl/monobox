<template>
  <span class="min-w-0 flex-1">
    <span class="block truncate">
      {{ titleParts.memoTitle }}
      <span v-if="external">[external]</span>
    </span>
    <span
      v-if="titleParts.context"
      class="memo-link-description block truncate text-xs"
    >
      @{{ titleParts.context }}
    </span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  external?: boolean;
}>();

const titleParts = computed(() => {
  const parts = props.title.split('/');
  const memoTitle = parts.pop() ?? props.title;
  return { memoTitle, context: parts.join('/') };
});
</script>
