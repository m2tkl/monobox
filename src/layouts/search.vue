<template>
  <div class="size-full">
    <div class="border-top flex h-full w-full overflow-hidden">
      <!-- Activity Bar -->
      <ActivityBar />

      <!-- Main content (no sidebar) -->
      <div class="flex h-full min-w-0 flex-1">
        <div class="size-full overflow-hidden">
          <main class="h-full w-full overflow-y-auto">
            <slot name="main" />
          </main>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import ActivityBar from '~/app/chrome/ActivityBar/Index.vue';
</script>
