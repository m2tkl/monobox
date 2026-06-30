<template>
  <div class="shortcut-builder">
    <div class="shortcut-builder__modifiers">
      <AppButton
        v-for="modifierOption in modifierOptions"
        :key="modifierOption.key"
        class="shortcut-builder__toggle"
        size="sm"
        :color="parsedShortcut[modifierOption.key] ? 'primary' : 'neutral'"
        :variant="parsedShortcut[modifierOption.key] ? 'solid' : 'outline'"
        :disabled="disabled"
        :aria-pressed="parsedShortcut[modifierOption.key]"
        @click="toggleModifier(modifierOption.key)"
      >
        <AppKbd
          size="sm"
          variant="subtle"
          :value="modifierOption.kbdValue"
        />
        <span>{{ modifierOption.label }}</span>
      </AppButton>
    </div>

    <div class="shortcut-builder__key">
      <AppInput
        v-model="shortcutKey"
        class="shortcut-builder__key-input"
        placeholder="Key"
        :disabled="disabled"
        @keydown="recordShortcutKey"
        @blur="shortcutKey = shortcutKey"
      />
    </div>

    <div
      class="shortcut-builder__preview"
      aria-live="polite"
    >
      <template
        v-for="(part, index) in previewParts"
        :key="part.id"
      >
        <span
          v-if="index > 0"
          class="shortcut-builder__plus"
        >+</span>
        <AppKbd
          size="md"
          :value="part.kbdValue"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import {
  buildShortcut,
  parseShortcut,
  shortcutKeyFromKeyboardEvent,
  type ShortcutModel,
} from './shortcutBuilder';

import AppButton from '~/app/elements/AppButton.vue';
import AppInput from '~/app/elements/AppInput.vue';
import AppKbd from '~/app/elements/AppKbd.vue';

const model = defineModel<string>({ required: true });

defineProps<{
  disabled?: boolean;
}>();

type ShortcutModifierKey = keyof Pick<ShortcutModel, 'modifier' | 'alt' | 'shift'>;
type ShortcutPreviewPart = {
  id: string;
  kbdValue: string;
};

const modifierOptions: Array<{ key: ShortcutModifierKey; label: string; kbdValue: string }> = [
  { key: 'modifier', label: 'Modifier', kbdValue: 'meta' },
  { key: 'alt', label: 'Alt', kbdValue: 'alt' },
  { key: 'shift', label: 'Shift', kbdValue: 'shift' },
];

const parsedShortcut = computed(() => parseShortcut(model.value));
const shortcutKey = computed({
  get: () => parsedShortcut.value.key,
  set: (key: string) => updateShortcut({ key }),
});
const previewParts = computed(() => {
  const parts: ShortcutPreviewPart[] = [];

  if (parsedShortcut.value.modifier) {
    parts.push({ id: 'modifier', kbdValue: 'meta' });
  }
  if (parsedShortcut.value.alt) {
    parts.push({ id: 'alt', kbdValue: 'alt' });
  }
  if (parsedShortcut.value.shift) {
    parts.push({ id: 'shift', kbdValue: 'shift' });
  }

  parts.push({ id: 'key', kbdValue: parsedShortcut.value.key || 'Key' });

  return parts;
});

const toggleModifier = (key: ShortcutModifierKey) => {
  updateShortcut({ [key]: !parsedShortcut.value[key] });
};

const updateShortcut = (updates: Partial<ShortcutModel>) => {
  model.value = buildShortcut({
    ...parsedShortcut.value,
    ...updates,
  });
};

const recordShortcutKey = (event: KeyboardEvent) => {
  if (event.key === 'Tab') return;

  const key = shortcutKeyFromKeyboardEvent(event);
  if (key === null) return;

  event.preventDefault();
  shortcutKey.value = key;
};
</script>

<style scoped>
.shortcut-builder {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 7rem;
  gap: 0.625rem;
  width: min(100%, 30rem);
}

.shortcut-builder__modifiers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

:deep(.shortcut-builder__toggle) {
  min-width: 5.75rem;
  justify-content: center;
  gap: 0.375rem;
}

.shortcut-builder__key {
  min-width: 0;
}

.shortcut-builder__key-input {
  width: 100%;
}

.shortcut-builder__preview {
  display: flex;
  grid-column: 1 / -1;
  min-height: 2rem;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-secondary);
}

.shortcut-builder__plus {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

@media (max-width: 560px) {
  .shortcut-builder {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
