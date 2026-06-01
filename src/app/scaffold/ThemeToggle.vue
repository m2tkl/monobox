<template>
  <AppButton
    class="theme-toggle"
    :icon="currentTheme.config.icon"
    variant="ghost"
    color="neutral"
    size="sm"
    square
    :title="`Current: ${currentTheme.config.name}. Click to cycle themes.`"
    @click="nextTheme"
  />
</template>

<script setup lang="ts">
const { currentTheme, nextTheme } = useTheme();
</script>

<style scoped>
.theme-toggle {
  width: 2rem;
  height: 2rem;
  padding: 0;
}
</style>
