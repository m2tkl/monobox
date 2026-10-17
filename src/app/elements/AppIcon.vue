<template>
  <UIcon
    :name="name"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>
