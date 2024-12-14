<template>
  <div>Hello</div>
  {{ workspaces }}
</template>

<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core';

type Workspace = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
}

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
