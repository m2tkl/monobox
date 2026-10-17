<template>
  <UModal
    v-model:open="isSearchPaletteOpen"
    title="''"
    :ui="{
      overlay: 'bg-modal-overlay',
    }"
  >
    <!-- NOTE:
      - autoclear: false
        When input is entered in the input field, the items are filtered, but upon selection,
        the filter is cleared, causing all items to become visible before taking action.
        Setting autoclear to false prevents the filter from being cleared (since it is manually cleared,
        it remains cleared the next time it is opened, so there is no issue).
    -->
    <template #content>
      <div
        ref="paletteRoot"
        class="search-palette"
        @keydown.capture="onPaletteKeydown"
      >
        <AppSearchCategories
          v-if="searchModes && type === 'search'"
          :model-value="searchMode"
          :items="searchCategories"
          @update:model-value="setSearchMode"
        />
        <UCommandPalette
          v-model:search-term="searchTerm"
          v-model="selected"
          :groups="commandPaletteItems"
          class="max-h-[calc(60vh)] min-h-[calc(60vh)]"
          :autoclear="false"
          :icon="type === 'link' ? iconKey.link : iconKey.search"
          :placeholder="searchPlaceholder"
          :loading="sources.isLoading.value"
          :ui="type === 'search' && searchMode === 'full-text'
            ? { itemLabel: 'flex-1 min-w-0 text-left' }
            : undefined"
          :fuse="{ fuseOptions: { includeMatches: true }, resultLimit: SEARCH_RESULT_LIMIT }"
          command-attribute="title"
          :empty-state="{
            icon: iconKey.search,
            label: 'We couldn\'t find any items.',
            queryLabel: 'We couldn\'t find any items with that term.',
          }"
          @update:model-value="onSearchPaletteSelect"
        >
          <template
            v-if="type === 'search' && searchMode === 'full-text'"
            #item-label="{ item }"
          >
            <span class="full-text-result flex w-full min-w-0 flex-col gap-1 py-1 text-left">
              <span
                class="full-text-result__title truncate"
                style="color: var(--color-text-primary)"
              >{{ item.label }}</span>
              <span
                v-if="getCommandDescription(item)"
                class="line-clamp-2 whitespace-normal text-sm"
                style="color: var(--color-text-muted)"
              >
                {{ getCommandDescription(item) }}
              </span>
            </span>
          </template>
          <template #item-trailing="{ item }">
            <span
              v-if="isFileCommand(item)"
              class="file-info-action"
              :data-file-id="item.slug"
              role="button"
              :aria-label="`Edit information for ${item.label}`"
              title="Edit information (Command-I)"
              @pointerdown.stop.prevent
              @click.stop.prevent="openFileInspector(item.slug)"
            >
              <span aria-hidden="true">ⓘ</span>
            </span>
          </template>
        </UCommandPalette>

        <p
          v-if="sources.error.value"
          role="status"
          class="px-4 py-2 text-sm"
        >
          {{ sources.error.value }}
        </p>

        <div
          v-if="$slots.actions"
          class="search-palette__actions"
        >
          <slot
            name="actions"
            :close="closeSearchPalette"
            :mode="searchMode"
          />
        </div>
      </div>
    </template>
  </UModal>

  <FileInspectorDialog
    ref="fileInspectorRef"
    :workspace-slug="workspaceSlug"
    @saved="onFileInspectorSaved"
  />
</template>

<script setup lang="ts">
import { usePaletteSearchSources, type PaletteSearchMode } from './usePaletteSearchSources';
import { useSearchPalette } from './useSearchPalette';

import type { SearchNavigationTarget } from './useSearchPalette';
import type { Editor } from '@tiptap/core';
import type { SearchLaunchOptions, SearchOpenDestination } from '~/app/features/search/searchLauncher';
import type { ManagedFileDetail, ManagedFileListItem } from '~/models/file';
import type { MemoIndexItem, MemoSearchItem } from '~/models/memo';

import AppSearchCategories from '~/app/elements/AppSearchCategories.vue';
import { FileInspectorDialog } from '~/app/features/files';
import { openManagedFile } from '~/app/features/files/resource/command/openManagedFile';

const props = defineProps<{
  type: 'search' | 'link';
  workspaceSlug: string;
  memos: MemoIndexItem[];
  currentMemoSlug?: string;
  currentMemoTitle?: string;
  editor?: Editor;
  shortcutSymbol: string;
  searchModes?: boolean;
}>();

const emit = defineEmits<{
  navigate: [target: SearchNavigationTarget, destination: SearchOpenDestination];
}>();

const SEARCH_RESULT_LIMIT = 30;
const toast = useToast();
const paletteRoot = ref<HTMLElement | null>(null);
const fileInspectorRef = ref<InstanceType<typeof FileInspectorDialog> | null>(null);
const searchDestination = ref<SearchOpenDestination>('active-tab');
const searchMode = ref<PaletteSearchMode>('memos');
const fullTextResults = ref<MemoSearchItem[]>([]);
const files = ref<ManagedFileListItem[]>([]);
const searchCategories = [
  { value: 'memos', label: 'Memos' },
  { value: 'full-text', label: 'Full text' },
  { value: 'files', label: 'Files' },
];
const searchPlaceholder = computed(() => {
  if (props.type === 'link') return 'Search memos to link';
  if (searchMode.value === 'full-text') return 'Search memo contents';
  if (searchMode.value === 'files') return 'Search files by name';
  return 'Search or create a memo';
});

const {
  searchTerm,
  selected,
  isSearchPaletteOpen,
  commandPaletteItems,
  onSearchPaletteSelect,
  onSearchModeKeydown,
  openCommandPalette,
  closeCommandPalette,
} = useSearchPalette({
  ...toRefs(props),
  mode: searchMode,
  fullTextResults,
  files,
  onOpenFile: async (fileId) => {
    try {
      await openManagedFile(fileId);
      return true;
    }
    catch {
      toast.add({ title: 'Failed to open file.', color: 'error' });
      return false;
    }
  },
  onNavigate: target => emit('navigate', target, searchDestination.value),
});

const sources = usePaletteSearchSources({
  enabled: computed(() => !!props.searchModes && props.type === 'search'),
  open: isSearchPaletteOpen,
  mode: searchMode,
  query: searchTerm,
  workspaceSlug: toRef(props, 'workspaceSlug'),
  fullTextResults,
  files,
});

function setSearchMode(value: string) {
  searchMode.value = value as PaletteSearchMode;
  selected.value = [];
}

function isFileCommand(item: unknown): item is { tag: 'file'; slug: string; label: string } {
  return !!item
    && typeof item === 'object'
    && 'tag' in item
    && item.tag === 'file'
    && 'slug' in item
    && typeof item.slug === 'string'
    && 'label' in item
    && typeof item.label === 'string';
}

function getCommandDescription(item: unknown) {
  if (!item || typeof item !== 'object' || !('description' in item)) return '';
  return typeof item.description === 'string' ? item.description : '';
}

function openFileInspector(fileId: string) {
  void fileInspectorRef.value?.open(fileId);
}

function getHighlightedFileId() {
  const input = paletteRoot.value?.querySelector<HTMLInputElement>('input[aria-activedescendant]');
  const activeId = input?.getAttribute('aria-activedescendant');
  if (!activeId) return '';
  const activeOption = document.getElementById(activeId);
  return activeOption?.querySelector<HTMLElement>('[data-file-id]')?.dataset.fileId ?? '';
}

function onPaletteKeydown(event: KeyboardEvent) {
  if (
    props.type === 'search'
    && searchMode.value === 'files'
    && event.metaKey
    && !event.ctrlKey
    && !event.altKey
    && !event.shiftKey
    && event.key.toLowerCase() === 'i'
  ) {
    const fileId = getHighlightedFileId();
    if (fileId) {
      event.preventDefault();
      event.stopPropagation();
      openFileInspector(fileId);
      return;
    }
  }

  if (props.searchModes) onSearchModeKeydown(event);
}

function onFileInspectorSaved(updated: ManagedFileDetail) {
  const file = files.value.find(item => item.id === updated.id);
  if (file) file.display_name = updated.display_name;
}

function closeSearchPalette() {
  closeCommandPalette([isSearchPaletteOpen]);
}

const openBaseCommandPalette = openCommandPalette;

function openSearchPalette(initialTerm: string = '', options: SearchLaunchOptions = {}) {
  searchDestination.value = options.destination ?? 'active-tab';
  openBaseCommandPalette(initialTerm);
}

watch(isSearchPaletteOpen, (open) => {
  if (!open) searchDestination.value = 'active-tab';
});

defineExpose({
  openCommandPalette: openSearchPalette,
});
</script>

<style scoped>
.search-palette__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  padding: 0.5rem;
  border-top: 1px solid var(--color-border-light);
}

.search-palette__actions :deep(button) {
  flex-shrink: 0;
  justify-content: center;
  white-space: nowrap;
}

.file-info-action {
  display: inline-flex;
  width: 1.75rem;
  height: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  opacity: 0;
  transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.search-palette :deep([role="option"]:hover) .file-info-action,
.search-palette :deep([data-highlighted]) .file-info-action,
.file-info-action:focus-visible {
  opacity: 1;
}

.file-info-action:hover,
.file-info-action:focus-visible {
  color: var(--color-text-primary);
  background: var(--color-surface-muted);
  outline: none;
}
</style>
