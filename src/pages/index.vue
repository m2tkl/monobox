<template>
  <div>
    <UContainer>
      <div>
        <!-- Project collection header -->
        <h2 class="font-bold text-gray-600 pl-1">Workspace</h2>

        <div class="flex justify-between pt-2 pb-4 space-x-3">
          <UInput placeholder="Search" class="flex-1 max-w-lg" />
          <div>
            <UButton>New</UButton>
          </div>
        </div>

        <!-- Project collection -->
        <div v-if="workspaces == null">No workspace</div>
        <div v-else>
          <ul class="border border-gray-400 divide-y divide-gray-400 rounded-md">
            <li v-for="workspace in workspaces" class="hover:bg-slate-300">
              <NuxtLink :to="`/${workspace.slug_name}`">
                <div class="px-4 py-2 flex justify-between items-center">
                  <span class="font-bold text-gray-600">
                    {{ workspace.name }}
                  </span>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core';
import { type Workspace } from '~/models/workspace';

async function fetchWorkspaces() {
  try {
    const workspaces = await invoke<Workspace[]>('get_workspaces');
    console.log('Fetched workspaces:', workspaces);
    return workspaces
  } catch (error) {
    console.error('Error fetching workspaces:', error);
  }
}

const workspaces = ref()
workspaces.value = await fetchWorkspaces()
</script>
