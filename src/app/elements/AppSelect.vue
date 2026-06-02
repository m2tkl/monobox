<template>
  <select
    v-model="selectValue"
    class="app-select"
    :disabled="disabled"
  >
    <option
      v-if="placeholder"
      value=""
    >
      {{ placeholder }}
    </option>
    <option
      v-for="item in items"
      :key="String(item.value)"
      :value="String(item.value)"
    >
      {{ item.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type SelectValue = string | number | null;

const model = defineModel<SelectValue>();

const props = withDefaults(defineProps<{
  items: { label: string; value: string | number }[];
  placeholder?: string;
  disabled?: boolean;
}>(), {
  placeholder: '',
});

const selectValue = computed({
  get: () => model.value == null ? '' : String(model.value),
  set: (value: string) => {
    if (value === '') {
      model.value = null;
      return;
    }

    const item = props.items.find(candidate => String(candidate.value) === value);
    model.value = item?.value ?? value;
  },
});
</script>

<style scoped>
.app-select {
  width: 100%;
  min-height: 34px;
  border: 1px solid var(--color-border-light);
  border-radius: calc(var(--ui-radius) * 1.5);
  padding: 0 34px 0 10px;
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.app-select:hover {
  border-color: var(--color-border-hover);
}

.app-select:focus-visible {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: inset 0 0 0 1px var(--color-primary);
}

.app-select:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}
</style>
