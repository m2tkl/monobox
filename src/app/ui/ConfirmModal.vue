<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <div class="space-y-3">
          <div
            class="text-sm font-semibold"
            style="color: var(--color-text-primary)"
          >
            {{ title }}
          </div>
          <div
            v-if="description"
            class="text-xs"
            style="color: var(--color-text-secondary)"
          >
            {{ description }}
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <AppButton
              type="button"
              @click="cancel"
            >
              {{ cancelLabel }}
            </AppButton>
            <UButton
              type="button"
              variant="subtle"
              :color="confirmColor"
              :loading="loading"
              @click="confirm"
            >
              {{ confirmLabel }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import AppButton from '~/app/ui/AppButton.vue';

const props = withDefaults(defineProps<{
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'neutral' | 'primary' | 'error' | 'success' | 'warning';
  loading?: boolean;
}>(), {
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  confirmColor: 'error',
  loading: false,
});

const emit = defineEmits<{
  'update:open': [boolean];
  'confirm': [];
  'cancel': [];
}>();

const open = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

const cancel = () => {
  emit('update:open', false);
  emit('cancel');
};

const confirm = () => {
  emit('confirm');
};
</script>
