<template>
  <IconButton
    :icon="currentTheme.config.icon"
    aria-label="Change theme"
    :title="`Current: ${currentTheme.config.name}. Click to cycle themes.`"
    @click="nextTheme"
  />
</template>

<script setup lang="ts">
import IconButton from '~/app/elements/IconButton.vue';

const { currentTheme, nextTheme } = useTheme();
</script>
