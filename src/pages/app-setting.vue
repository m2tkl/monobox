<template>
  <div>
    <UContainer>
      <div class="space-y-6">
        <div class="flex items-center justify-between space-x-3 pt-2">
          <h2 class="pl-1 text-2xl font-bold text-gray-600">
            Settings
          </h2>
        </div>

        <!-- Theme Settings -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">
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
                <span class="text-sm text-gray-500">
                  Current: {{ currentTheme.config.name }} - {{ currentTheme.config.description }}
                </span>
              </div>
            </UFormGroup>
          </div>
        </UCard>

        <!-- Other Settings -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">
              Other Settings
            </h3>
          </template>

          <p class="text-gray-500">
            🚧 Under construction
          </p>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';

definePageMeta({
  path: '/_setting',
});

const { currentTheme } = useTheme();
const _appConfig = JSON.parse(await readTextFile('config.json', { baseDir: BaseDirectory.AppData }));
</script>
