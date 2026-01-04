<template>
  <NuxtLayout name="workspace-entry">
    <UContainer>
      <div class="max-w-3xl mx-auto py-8 space-y-6">
        <div>
          <h1
            class="text-2xl font-bold"
            style="color: var(--color-text-primary)"
          >
            Set up storage
          </h1>
          <p
            class="text-sm"
            style="color: var(--color-text-secondary)"
          >
            Choose the database file and asset folder to start using the app.
          </p>
        </div>

        <div class="space-y-4">
          <StoragePathsForm
            mode="setup"
            @saved="handleSaved"
          />

          <div
            v-if="savedOnce"
            class="text-sm"
            style="color: var(--color-text-secondary)"
          >
            Restart the app to apply the new storage settings.
          </div>
        </div>
      </div>
    </UContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import StoragePathsForm from '~/app/features/settings/StoragePathsForm.vue';

definePageMeta({
  path: '/_setup',
});

const savedOnce = ref(false);
const handleSaved = () => {
  savedOnce.value = true;
};
</script>

<style scoped>
</style>
