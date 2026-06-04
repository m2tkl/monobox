<template>
  <div
    class="app-page-frame"
    :class="[
      `app-page-frame--${variant}`,
      {
        'app-page-frame--contained': contained,
        'app-page-frame--fill': fill,
      },
    ]"
  >
    <div
      class="app-page-frame__inner"
      :class="innerClass"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'standard' | 'split';
  contained?: boolean;
  fill?: boolean;
  innerClass?: string;
}>(), {
  variant: 'standard',
  contained: false,
  fill: false,
  innerClass: '',
});
</script>

<style scoped>
.app-page-frame {
  box-sizing: border-box;
  min-width: 0;
  min-height: 100%;
  padding: var(--app-page-padding);
}

.app-page-frame--fill {
  height: 100%;
  min-height: 0;
}

.app-page-frame__inner {
  min-width: 0;
  width: 100%;
}

.app-page-frame--fill .app-page-frame__inner {
  height: 100%;
  min-height: 0;
}

.app-page-frame--contained .app-page-frame__inner {
  max-width: var(--app-page-max-width);
  margin-right: auto;
  margin-left: auto;
}

.app-page-frame--split {
  padding: 0;
}
</style>
