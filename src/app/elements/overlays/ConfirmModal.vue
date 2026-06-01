<template>
  <AppDialog
    v-model:open="open"
    :title="title"
    :description="description"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton
          type="button"
          color="neutral"
          variant="ghost"
          @click="cancel"
        >
          {{ cancelLabel }}
        </AppButton>
        <AppButton
          type="button"
          variant="subtle"
          :color="confirmColor"
          :loading="loading"
          @click="confirm"
        >
          {{ confirmLabel }}
        </AppButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import AppButton from '~/app/elements/AppButton.vue';
import AppDialog from '~/app/elements/overlays/AppDialog.vue';

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
