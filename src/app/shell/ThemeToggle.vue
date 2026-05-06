<template>
  <UButton
    :icon="currentTheme.config.icon"
    variant="ghost"
    color="neutral"
    size="sm"
    :title="`Current: ${currentTheme.config.name}. Click to cycle themes.`"
    @click="nextTheme"
  />
</template>

<script setup lang="ts">
const { currentTheme, nextTheme } = useTheme();
</script>
