<template>
  <UModal
    v-model:open="openModel"
    :ui="modalUi"
  >
    <template #content>
      <UCard
        :class="cardClass"
        :ui="resolvedCardUi"
      >
        <template
          v-if="$slots.header || title || description"
          #header
        >
          <slot name="header">
            <div class="space-y-1">
              <div
                v-if="title"
                class="text-sm font-semibold"
                style="color: var(--color-text-primary)"
              >
                {{ title }}
              </div>
              <div
                v-if="description"
                class="text-sm"
                style="color: var(--color-text-secondary)"
              >
                {{ description }}
              </div>
            </div>
          </slot>
        </template>

        <slot v-if="hasDefaultSlot" />

        <template
          v-if="$slots.footer"
          #footer
        >
          <slot name="footer" />
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title?: string;
  description?: string;
  modalUi?: Record<string, string>;
  cardClass?: string;
  cardUi?: Record<string, string>;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const openModel = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

const slots = useSlots();
const hasDefaultSlot = computed(() => !!slots.default);
const resolvedCardUi = computed(() => {
  if (hasDefaultSlot.value) {
    return props.cardUi;
  }

  return {
    ...props.cardUi,
    body: [props.cardUi?.body, 'hidden p-0 sm:p-0'].filter(Boolean).join(' '),
  };
});
</script>
