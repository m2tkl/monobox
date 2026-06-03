<template>
  <AppDialog
    :open="open"
    :title="date"
    description="Add a note or link memos."
    card-class="calendar-day-dialog"
    @update:open="$emit('update:open', $event)"
  >
    <div class="calendar-day-dialog-body">
      <div class="calendar-dialog-field">
        <label class="calendar-dialog-label">Note</label>
        <AppTextarea
          v-model="draftNote"
          :rows="4"
          placeholder="Add a note for this date"
        />
      </div>

      <div class="calendar-dialog-field">
        <label class="calendar-dialog-label">Linked memos</label>
        <AppInput
          v-model="memoQuery"
          size="sm"
          placeholder="Search memos"
        />

        <div
          v-if="linkedMemos.length > 0"
          class="calendar-linked-memos"
        >
          <div
            v-for="memo in linkedMemos"
            :key="memo.slug_title"
            class="calendar-linked-memo"
          >
            <NuxtLink
              :to="`/${workspaceSlug}/${memo.slug_title}`"
              class="calendar-linked-memo-title"
            >
              {{ memo.title }}
            </NuxtLink>
            <IconButton
              :icon="iconKey.close"
              aria-label="Remove linked memo"
              @click="$emit('remove-memo', memo.slug_title)"
            />
          </div>
        </div>

        <div class="calendar-memo-results">
          <button
            v-for="memo in filteredMemos"
            :key="memo.slug_title"
            type="button"
            class="calendar-memo-result"
            @click="$emit('add-memo', memo.slug_title)"
          >
            <span class="calendar-memo-result-title">{{ memo.title }}</span>
            <span
              v-if="memo.description"
              class="calendar-memo-result-description"
            >{{ memo.description }}</span>
          </button>
          <div
            v-if="filteredMemos.length === 0"
            class="calendar-memo-empty"
          >
            No matching memos.
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="calendar-dialog-footer">
        <AppButton
          color="neutral"
          variant="ghost"
          @click="$emit('update:open', false)"
        >
          Cancel
        </AppButton>
        <AppButton
          :loading="saving"
          @click="$emit('save', { note: draftNote })"
        >
          Save
        </AppButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import type { CalendarDayMemo } from '~/models/calendarDay';
import type { MemoIndexItem } from '~/models/memo';

import AppButton from '~/app/elements/AppButton.vue';
import AppInput from '~/app/elements/AppInput.vue';
import AppTextarea from '~/app/elements/AppTextarea.vue';
import IconButton from '~/app/elements/IconButton.vue';
import AppDialog from '~/app/elements/overlays/AppDialog.vue';
import { iconKey } from '~/utils/icon';

const props = defineProps<{
  open: boolean;
  date: string;
  workspaceSlug: string;
  note?: string | null;
  linkedMemos: CalendarDayMemo[];
  memos: MemoIndexItem[];
  saving: boolean;
}>();

defineEmits<{
  'update:open': [value: boolean];
  'save': [value: { note: string | null }];
  'add-memo': [memoSlug: string];
  'remove-memo': [memoSlug: string];
}>();

const draftNote = ref<string | null>(null);
const memoQuery = ref('');

watch(
  () => [props.open, props.date, props.note] as const,
  () => {
    if (!props.open) return;
    draftNote.value = props.note ?? null;
    memoQuery.value = '';
  },
  { immediate: true },
);

const linkedMemoSlugs = computed(() => new Set(props.linkedMemos.map(memo => memo.slug_title)));
const filteredMemos = computed(() => {
  const query = memoQuery.value.trim().toLocaleLowerCase('ja-JP');

  return props.memos
    .filter(memo => !linkedMemoSlugs.value.has(memo.slug_title))
    .filter((memo) => {
      if (!query) return true;
      return memo.title.toLocaleLowerCase('ja-JP').includes(query)
        || memo.slug_title.toLocaleLowerCase('ja-JP').includes(query)
        || (memo.description ?? '').toLocaleLowerCase('ja-JP').includes(query);
    })
    .slice(0, 20);
});
</script>

<style scoped>
.calendar-day-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.calendar-dialog-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calendar-dialog-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.calendar-linked-memos {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.calendar-linked-memo {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 4px 3px 8px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface);
}

.calendar-linked-memo-title {
  max-width: 240px;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-memo-results {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}

.calendar-memo-result {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border-light);
  text-align: left;
}

.calendar-memo-result:last-child {
  border-bottom: 0;
}

.calendar-memo-result:hover {
  background: var(--color-surface-hover);
}

.calendar-memo-result-title {
  color: var(--color-text-primary);
  font-size: 13px;
}

.calendar-memo-result-description,
.calendar-memo-empty {
  color: var(--color-text-muted);
  font-size: 12px;
}

.calendar-memo-empty {
  padding: 10px;
}

.calendar-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
