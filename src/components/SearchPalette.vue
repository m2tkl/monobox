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
        ref="commandPaletteRef"
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
import { invoke } from '@tauri-apps/api/core';

import type { CommandPaletteItem } from '@nuxt/ui';
import type { Editor } from '@tiptap/vue-3';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';
import type { Workspace } from '~/models/workspace';

import * as EditorAction from '~/lib/editor/action.js';

const props = defineProps<{
  type: 'search' | 'link';
  workspace: Workspace;
  memos: MemoIndexItem[];
  editor?: Editor;
  shortcutSymbol: string;
}>();

defineExpose({
  openCommandPalette,
});

const router = useRouter();
const logger = useConsoleLogger('[components/Search/SearchPalette]:');

const selected = ref([]);
const isSearchPaletteOpen = ref(false);
const commandPaletteRef = ref();

type Command = CommandPaletteItem & { tag: string; label: string };

type Commands = {
  id: string;
  label: string;
  items: Command[];
};

function isCommand(item: CommandPaletteItem): item is Command {
  return 'tag' in item;
}

const searchTerm = ref('');

const commandPaletteItems = computed<Commands[]>(() => {
  if (!props.memos) {
    return [];
  }

  // NOTE: Add label for command palette
  const existingMemos = props.memos
    .toSorted()
    .map(memo => ({ ...memo, label: memo.title }));

  const linkPaletteCommands: Commands[] = [{
    id: 'existing-memos',
    label: 'Existing memos',
    items: existingMemos.map(memo => ({ label: memo.title, tag: 'existing' })),
  }];

  // While entering a query, if there is no existing memo with a title matching the query string,
  // a new command item is added at the top for creating a new memo.
  const query = searchTerm.value;
  if (query && !existingMemos.map(memo => memo.title).includes(query)) {
    const _ = linkPaletteCommands.unshift(
      {
        id: 'new',
        label: 'Or new memo',
        items: [{ label: query, tag: 'new' }],
      },
    );
  }

  return linkPaletteCommands;
});

/**
 * Create a link when an item is selected in the Link Palette.
 * @param option
 */
async function onSearchPaletteSelect(option: CommandPaletteItem) {
  logger.log('onSearchPaletteSelect() start.');

  if (!isCommand(option)) {
    logger.warn('Selected item is not a Command');
    return;
  }

  if (!isSearchPaletteOpen.value) {
    logger.warn('onSearchPalatteSelect()', 'palette is closed.');
    return;
  }

  if (
    option == null
    || searchTerm.value == null
  ) {
    logger.warn('onSearchPaletteSelect() validation failed.');
    return;
  }

  let linkMemoSlug = encodeForSlug(option.label);
  let linkMemoTitle = option.label;

  if (option.tag === 'new') {
    // Create new memo
    const newMemo = await invoke<MemoDetail>('create_memo', {
      args: {
        workspace_slug_name: props.workspace.slug_name,
        slug_title: encodeForSlug(searchTerm.value),
        title: searchTerm.value,
        content: JSON.stringify(''),
      },
    });

    linkMemoSlug = newMemo.slug_title;
    linkMemoTitle = newMemo.title;
  }

  /**
   * Before modal closes
   */

  if (props.type === 'link') {
    if (props.editor) {
      console.log('insertLinkToMemo');
      EditorAction.insertLinkToMemo(props.editor, linkMemoTitle, `/${props.workspace.slug_name}/${linkMemoSlug}`);
    }
  }

  /**
   * Close modal
   */

  // NOTE:
  //   Without waiting for nextTick(), the onSelect process will trigger twice.
  //   It is speculated that nextTick is necessary between opening the modal with isOpen = true
  //   and closing it.
  //   Ideally, the open and close processes should be paired properly.
  //   Perhaps the concern lies in the fact that onSelect is performing actions unrelated to selection?
  await nextTick();
  closeCommandPalette([isSearchPaletteOpen]);

  logger.log('onSearchPaletteSelect() end.');

  /**
   * After modal closed
   */

  // Navigate to a new page
  // NOTE: Using the format {name: 'workspace-memo', params: { workspace: ..., memo: ... }}
  // automatically encodes the parameters, so the path format is used instead.
  if (props.type === 'search') {
    router.push(`/${props.workspace.slug_name}/${linkMemoSlug}`);
  }
}

async function openCommandPalette() {
  logger.log('openCommandPalette() start.');
  isSearchPaletteOpen.value = true;
  selected.value = [];

  // If text is selected in the editor, set the text in the input field.
  if (props.editor && commandPaletteRef) {
    const selectedText = EditorAction.getSelectedTextV2(props.editor.view);
    await nextTick();
    commandPaletteRef.value.query = selectedText;
  }

  logger.log('openCommandPalette() end.');
}

function closeCommandPalette(paletteRefs: Array<Ref<boolean>>) {
  logger.log('closeCommandPalette() start.');

  // Close command palette
  for (const paletteRef of paletteRefs) {
    paletteRef.value = false;
  }

  /**
   * Remove focus from the input field inside the modal
   *
   * MEMO:
   *   It was observed that if the input field inside the modal retains focus,
   *   the focus cannot be set on the editor.
   *   It is assumed that only one element can be focused at a time, and there is a priority order,
   *   but the exact reason is unclear.
   */
  const modalInput = document.querySelector('input[data-headlessui-state]') as HTMLElement;
  if (modalInput) {
    modalInput.blur();
  }

  if (props.editor) {
    props.editor.commands.focus();
  }
  logger.log('closeCommandPalette() end.');
}

const handleKeydownShortcut = (event: KeyboardEvent) => {
  if (isCmdKey(event) && event.key === props.shortcutSymbol) {
    event.preventDefault();
    openCommandPalette();
    return;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydownShortcut);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydownShortcut);
});

defineShortcuts({
  /**
   * Handle behavior when the Escape key is pressed:
   * - Close the LinkPalette modal
   * - Resolve the issue where focus remains on a field inside the modal
   * - Return focus to the editor
   */
  escape: {
    // usinInput: Default is false. If set to true,
    // the shortcut will be triggered even when the input field is focused.
    usingInput: true,
    whenever: [isSearchPaletteOpen], // Triggered only when the modal is open
    handler: () => {
      closeCommandPalette([isSearchPaletteOpen]);
    },
  },
});
</script>
