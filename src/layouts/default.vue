<template>
  <div class="h-screen w-full">
    <header class="sticky top-0 z-50 flex h-14 items-center gap-3 bg-slate-200 px-6">

      <!-- Home -->
      <div v-if="!$route.params.workspace" class="flex items-center w-full">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <UIcon name="i-carbon:area" class="h-6 w-6 bg-slate-500" />
          <h1 v-if="!$route.params.workspace" class="font-mono text-xl font-semibold text-slate-500">
            monobox
          </h1>
        </NuxtLink>

        <div class="ml-auto">
          <NuxtLink to="/_setting" class="flex items-center gap-2.5">
            <UIcon name="carbon:settings" class="h-6 w-6" />
          </NuxtLink>
        </div>
      </div>

      <!-- Workspace/**  -->
      <div v-else="$route.params.workspace" class="flex items-center w-full">
        <div class="flex items-center gap-2.5">
          <NuxtLink to="/" class="flex items-center">
            <UIcon name="i-carbon:area" class="h-6 w-6 bg-slate-500" />
          </NuxtLink>

          <h1 class="font-mono text-xl font-semibold text-slate-500">
            <USkeleton class="h-6 w-[250px]" v-if="!wspace" />
            <NuxtLink v-else :to="`/${$route.params.workspace}`">
              {{ wspace.name }}
            </NuxtLink>
          </h1>
        </div>

        <div class="ml-auto">
          <NuxtLink :to="`/${$route.params.workspace}/_setting`" class="flex items-center gap-2.5">
            <UIcon name="carbon:overflow-menu-vertical" class="h-6 w-6" />
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="h-[calc(100%-56px)] overflow-y-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { workspace: wspace } = useWorkspace()
</script>

<style>
body {
  background-color: rgb(226 232 240);
}
</style>
