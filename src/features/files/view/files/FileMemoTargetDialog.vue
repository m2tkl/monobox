<template>
  <UCard
    class="file-target-dialog"
    :ui="{
      root: 'flex flex-col',
      header: 'shrink-0 p-4 sm:px-6',
      body: 'flex-1 min-h-0 overflow-y-auto p-4 sm:p-6',
      footer: 'shrink-0 p-4 sm:px-6',
    }"
  >
    <template #header>
      <div class="space-y-1">
        <div class="text-sm font-semibold">
          {{ title }}
        </div>
        <p class="text-sm link-modal-description">
          {{ description }}
        </p>
      </div>
    </template>

    <div class="dialog-body space-y-4">
      <div class="link-summary-card">
        <div class="link-summary-value">
          {{ fileDisplayName || 'Nothing selected' }}
        </div>
      </div>

      <div class="note-section">
        <div class="link-summary-label">
          {{ noteLabel }}
        </div>

        <UCommandPalette
          v-model:search-term="searchTerm"
          v-model="selectedCommand"
          class="memo-command-palette"
          :groups="groups"
          :autoclear="false"
          icon="carbon:search"
          placeholder="Search notes"
          command-attribute="title"
          :fuse="{ fuseOptions: { includeMatches: true }, resultLimit: 30 }"
          :empty-state="{
            icon: 'carbon:search-locate',
            label: 'No notes found.',
            queryLabel: 'No matching notes found.',
          }"
          @update:model-value="$emit('select-command', $event)"
        />
      </div>

      <div class="selected-memo-slot">
        <div
          class="selected-memo-card"
          :class="{ 'selected-memo-card--active': !!selectedMemoTitle }"
        >
          <div class="selected-memo-label">
            Selected
          </div>
          <div class="selected-memo-value">
            {{ selectedMemoTitle || 'None' }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton
          color="neutral"
          variant="ghost"
          @click="$emit('close')"
        >
          Close
        </AppButton>
        <AppButton
          :disabled="actionDisabled"
          :loading="actionLoading"
          @click="$emit('submit')"
        >
          {{ actionLabel }}
        </AppButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
type MemoCommandItem = {
  label: string;
  title: string;
  slug: string;
};

type MemoCommandGroup = {
  id: string;
  label: string;
  ignoreFilter?: boolean;
  items: MemoCommandItem[];
};

defineProps<{
  title: string;
  description: string;
  noteLabel: string;
  actionLabel: string;
  actionDisabled: boolean;
  actionLoading: boolean;
  fileDisplayName: string;
  selectedMemoTitle: string;
  groups: MemoCommandGroup[];
}>();

defineEmits<{
  'close': [];
  'submit': [];
  'select-command': [command: unknown];
}>();

const searchTerm = defineModel<string>('searchTerm', { default: '' });
const selectedCommand = defineModel<unknown[]>('selectedCommand', { default: [] });
</script>

<style scoped>
.file-target-dialog {
  width: min(42rem, calc(100vw - 1rem));
  max-width: 42rem;
  max-height: calc(100dvh - 1rem);
  overflow: hidden;
}

.note-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.link-modal-description {
  color: var(--color-text-secondary);
}

.link-summary-card {
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--color-surface-muted) 88%, var(--color-background));
}

.link-summary-label {
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.link-summary-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.memo-command-palette {
  min-height: 10rem;
  height: min(18rem, 30dvh);
  max-height: min(18rem, 30dvh);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--color-surface-elevated) 92%, var(--color-background));
}

.memo-command-palette :deep([data-slot='input']) {
  border-bottom: 1px solid var(--color-border-light);
}

.selected-memo-slot {
}

.selected-memo-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 0.95rem;
  width: 100%;
  border: 1px dashed color-mix(in srgb, var(--color-border-light) 72%, transparent);
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--color-surface-muted) 42%, transparent);
}

.selected-memo-card--active {
  border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border-light));
  background-color: color-mix(in srgb, var(--color-primary-light) 18%, var(--color-surface-elevated));
}

.selected-memo-label {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.selected-memo-card--active .selected-memo-label {
  color: var(--color-primary);
}

.selected-memo-value {
  min-width: 0;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.selected-memo-card--active .selected-memo-value {
  color: var(--color-text-primary);
}

@media (max-width: 640px) {
  .file-target-dialog {
    width: 100%;
    max-width: 100%;
  }

  .memo-command-palette {
    min-height: 9rem;
    height: min(12rem, 24dvh);
    max-height: min(12rem, 24dvh);
  }
}
</style>
