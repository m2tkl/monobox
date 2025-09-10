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
      <UCommandPalette
        v-model:search-term="searchTerm"
        v-model="selected"
        :groups="commandPaletteItems"
        class="max-h-[calc(60vh)] min-h-[calc(60vh)]"
        :autoclear="false"
        :icon="type === 'link' ? iconKey.link : iconKey.search"
        placeholder="Type something to see the empty label change"
        :fuse="{ fuseOptions: { includeMatches: true }, resultLimit: 10 }"
        command-attribute="title"
        :empty-state="{
          icon: iconKey.search,
          label: 'We couldn\'t find any items.',
          queryLabel: 'We couldn\'t find any items with that term.',
        }"
        @update:model-value="onSearchPaletteSelect"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import type { MemoIndexItem } from '~/models/memo';
import type { Workspace } from '~/models/workspace';

import { useSearchPalette } from '~/app/features/search/useSearchPalette';

const props = defineProps<{
  type: 'search' | 'link';
  workspace: Workspace;
  memos: MemoIndexItem[];
  currentMemoTitle?: string;
  editor?: Editor;
  shortcutSymbol: string;
}>();

const {
  searchTerm,
  selected,
  isSearchPaletteOpen,
  commandPaletteItems,
  onSearchPaletteSelect,
  openCommandPalette,
} = useSearchPalette({
  ...toRefs(props),
});

defineExpose({
  openCommandPalette,
});
</script>
