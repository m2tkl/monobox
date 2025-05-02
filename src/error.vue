<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps({
  error: Object as () => NuxtError,
});

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <div
    v-if="error"
    class="min-h-screen flex flex-col items-center justify-center bg-slate text-gray-800 px-4"
  >
    <div class="text-center space-y-6">
      <h2 class="text-2xl font-bold">
        {{ error.statusCode }}
      </h2>
      <p class="text-6xl font-bold">
        {{ error.statusMessage || 'Something went wrong' }}
      </p>
      <p class="text-lg text-gray-600">
        {{ error.message }}
      </p>

      <UButton
        class="mt-2"
        :icon="iconKey.arrowLeft"
        size="xl"
        color="neutral"
        @click="handleError"
      >
        Back to Home
      </UButton>
    </div>
  </div>
</template>
