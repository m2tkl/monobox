<template>
  <div>
    <UContainer style="padding-bottom: max(var(--spacing-xl), env(safe-area-inset-bottom));">
      <div class="space-y-6">
        <div class="flex items-center justify-between space-x-3 pt-2">
          <h2
            class="pl-1 text-2xl font-bold"
            style="color: var(--color-text-primary)"
          >
            Settings
          </h2>
        </div>

        <!-- Theme Settings -->
        <UCard
          class="card-themed"
        >
          <template #header>
            <h3
              class="text-base font-semibold"
              style="color: var(--color-text-primary)"
            >
              Appearance
            </h3>
          </template>

          <div class="space-y-6">
            <UFormGroup
              label="Color Theme"
              description="Choose your preferred color theme"
            >
              <div class="flex items-center gap-4">
                <ThemeSelector />
                <span
                  class="text-sm"
                  style="color: var(--color-text-secondary)"
                >
                  Current: {{ currentTheme.config.name }} - {{ currentTheme.config.description }}
                </span>
              </div>
            </UFormGroup>
          </div>
        </UCard>

        <!-- Storage Paths -->
        <UCard
          class="card-themed"
        >
          <template #header>
            <h3
              class="text-base font-semibold"
              style="color: var(--color-text-primary)"
            >
              Storage Paths
            </h3>
          </template>

          <StoragePathsForm mode="settings" />
        </UCard>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';

import StoragePathsForm from '~/app/features/settings/StoragePathsForm.vue';
import ThemeSelector from '~/app/features/settings/ThemeSelector.vue';

definePageMeta({
  path: '/_setting',
});

const { currentTheme } = useTheme();

/**
 * FIXME: Accessing the "_setting" route but triggers an error on Windows
 * due to a different configuration file path.
 *
 * On Windows, Tauri attempts to load:
 *  C:\Users\$username\AppData\Roaming\com.m2tkl.monobox\config.json
 *  which fails with "The system cannot find the path specified (os error 3)".
 *
 * The actual config file was found here instead:
 * C:\Users\$username\AppData\Roaming\m2tkl\monobox\config\config.json
 */
const _appConfig = JSON.parse(await readTextFile('config.json', { baseDir: BaseDirectory.AppData }));
</script>

<style scoped>
.card-themed {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border-light);
}

:deep(.card-themed .divide-y > *) {
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.card-themed [data-headlessui-state]) {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
}
</style>
