<template>
  <UModal
    v-model:open="modalOpen"
    title="Export result"
  >
    <template #body>
      <UTextarea
        v-model="textToExport_"
        class="w-full h-64"
        :rows="12"
      />
    </template>

    <template #footer>
      <UButton
        class="bg-slate-600"
        @click="$emit('copy', textToExport_)"
      >
        Copy
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const modalOpen = defineModel<boolean>('open');

const props = defineProps<{
  textToExport: string;
}>();

const textToExport_ = ref('');

watch(modalOpen, (opened) => {
  if (opened) {
    textToExport_.value = props.textToExport;
  }
});

defineEmits<{
  (e: 'copy', textToCopy: string): void;
}>();
</script>
