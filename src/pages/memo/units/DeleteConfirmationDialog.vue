<template>
  <UModal v-model:open="modalOpen">
    <template #content>
      <UCard>
        <div class="h-24">
          Once you delete a memo, there is no going back. Please be certain.
        </div>

        <template #footer>
          <div class="flex h-8 w-full">
            <UButton
              type="submit"
              color="error"
              @click="$emit('delete')"
            >
              Delete
            </UButton>

            <span class="flex-1" />

            <UButton
              variant="solid"
              color="neutral"
              @click="$emit('cancel')"
            >
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const modalOpen = defineModel<boolean>('open');

defineEmits<{
  (e: 'delete' | 'cancel'): void;
}>();
</script>
