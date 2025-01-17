<template>
  <div>
    <UContainer>
      <h2 class="text-lg font-bold text-gray-600"> Settings </h2>
      <p>
        🚧 Under construction
      </p>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

definePageMeta({
  path: "/_setting"
})

const _appConfig = JSON.parse(await readTextFile('config.json', { baseDir: BaseDirectory.AppData }));
</script>
