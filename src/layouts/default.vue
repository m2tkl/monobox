<template>
  <div class="h-screen w-full">
    <header class="sticky top-0 z-50 flex h-14 items-center gap-3 bg-slate-200 px-4">
      <div v-if="!$route.params.workspace" class="flex items-center">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <UIcon name="i-carbon:area" class="h-6 w-6 bg-slate-500" />
          <h1 v-if="!$route.params.workspace" class="font-mono text-xl font-semibold text-slate-500">
            monobox
          </h1>
        </NuxtLink>
      </div>
      <div v-if="$route.params.workspace" class="flex items-center gap-2.5">
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
      (For debug: {{ $route.path }})
    </header>

    <main class="h-[calc(100%-56px)]">
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
