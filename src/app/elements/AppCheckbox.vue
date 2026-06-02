<template>
  <UCheckbox
    v-model="model"
    v-bind="attrs"
    :label="label"
    :disabled="disabled"
    :required="required"
    :color="color"
    :size="size"
  />
</template>

<script setup lang="ts">
import { useAttrs } from 'vue';

const model = defineModel<boolean>();

withDefaults(defineProps<{
  label?: string;
  disabled?: boolean;
  required?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}>(), {
  color: 'primary',
  size: 'md',
});

const attrs = useAttrs();
</script>
