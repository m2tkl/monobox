import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

import type { CommandPaletteItem } from '@nuxt/ui';
import type { Editor } from '@tiptap/vue-3';
import type { MemoIndexItem } from '~/models/memo';
import type { Workspace } from '~/models/workspace';

import * as EditorAction from '~/lib/editor/action.js';
import * as EditorQuery from '~/lib/editor/query';
import { isCmdKey } from '~/utils/event';
import { useConsoleLogger } from '~/utils/logger';
import { encodeForSlug } from '~/utils/slug';

type Command = CommandPaletteItem & { tag: string; label: string };

type Commands = {
  id: string;
  label: string;
  items: Command[];
};

function isCommand(item: CommandPaletteItem): item is Command {
  return 'tag' in item;
}

export type UseSearchPaletteOptions = {
  type: Ref<'search' | 'link'>;
  workspace: Ref<Workspace>;
  memos: Ref<MemoIndexItem[]>;
  currentMemoTitle?: Ref<string | undefined>;
  editor?: Ref<Editor | undefined>;
  shortcutSymbol: Ref<string>;
};

export const useSearchPalette = (options: UseSearchPaletteOptions) => {
  const router = useRouter();
  const logger = useConsoleLogger('components/Search/SearchPalette');
  const command = useCommand();

  const selected = ref<unknown[]>([]);
  const isSearchPaletteOpen = ref(false);
  const searchTerm = ref('');

  const commandPaletteItems = computed<Commands[]>(() => {
    if (!options.memos?.value) return [];

    const existingMemos = options.memos.value
      .toSorted()
      .map(memo => ({ ...memo, label: memo.title }));

    const linkPaletteCommands: Commands[] = [{
      id: 'existing-memos',
      label: 'Existing memos',
      items: existingMemos.map(memo => ({ label: memo.title, tag: 'existing' })),
    }];

    const query = searchTerm.value;
    if (query && !existingMemos.map(memo => memo.title).includes(query)) {
      linkPaletteCommands.unshift({
        id: 'new',
        label: 'Or new memo',
        items: [{ label: query, tag: 'new' }],
      });
    }

    return linkPaletteCommands;
  });

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

    if (option == null || searchTerm.value == null) {
      logger.warn('onSearchPaletteSelect() validation failed.');
      return;
    }

    let linkMemoSlug = encodeForSlug(option.label);
    let linkMemoTitle = option.label;

    if (option.tag === 'new') {
      const newMemo = await command.memo.create({
        workspaceSlugName: options.workspace.value.slug_name,
        title: searchTerm.value,
      });

      linkMemoSlug = newMemo.slug_title;
      linkMemoTitle = newMemo.title;
    }

    if (options.type.value === 'link') {
      if (options.editor?.value) {
        EditorAction.insertLinkToMemo(options.editor.value, linkMemoTitle, `/${options.workspace.value.slug_name}/${linkMemoSlug}`);
      }
    }

    await nextTick();
    closeCommandPalette([isSearchPaletteOpen]);

    logger.log('onSearchPaletteSelect() end.');

    if (options.type.value === 'search') {
      router.push(`/${options.workspace.value.slug_name}/${linkMemoSlug}`);
    }
  }

  function openCommandPalette(initialTerm: string = '') {
    logger.log('openCommandPalette() start.');
    isSearchPaletteOpen.value = true;
    selected.value = [];

    if (initialTerm) {
      searchTerm.value = initialTerm;
    }

    logger.log('openCommandPalette() end.');
  }

  function closeCommandPalette(paletteRefs: Array<Ref<boolean>>) {
    logger.log('closeCommandPalette() start.');

    for (const paletteRef of paletteRefs) {
      paletteRef.value = false;
    }

    const modalInput = document.querySelector('input[data-headlessui-state]') as HTMLElement;
    if (modalInput) modalInput.blur();

    if (options.editor?.value) options.editor.value.commands.focus();
    logger.log('closeCommandPalette() end.');
  }

  function extractParentPathFromTitle(title: string): string {
    if (title.includes('/')) {
      const segments = title.split('/');
      if (segments.length > 1) return segments.slice(0, -1).join('/');
    }
    return '';
  }

  const handleKeydownShortcut = (event: KeyboardEvent) => {
    if (isCmdKey(event) && event.key === options.shortcutSymbol.value) {
      event.preventDefault();

      const selectedText = options.editor?.value ? EditorQuery.getSelectedTextV2(options.editor.value.view) : '';
      const parentPath = options.currentMemoTitle?.value ? extractParentPathFromTitle(options.currentMemoTitle.value) : '';
      const initialTerm = selectedText || parentPath || '';

      openCommandPalette(initialTerm);
      return;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeydownShortcut);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydownShortcut);
  });

  // Provide ESC shortcut while modal is open
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - defineShortcuts is auto-imported by @nuxt/ui
  defineShortcuts?.({
    escape: {
      usingInput: true,
      whenever: [isSearchPaletteOpen],
      handler: () => {
        closeCommandPalette([isSearchPaletteOpen]);
      },
    },
  });

  return {
    // state
    searchTerm,
    selected,
    isSearchPaletteOpen,
    commandPaletteItems,
    // actions
    onSearchPaletteSelect,
    openCommandPalette,
    closeCommandPalette,
  };
};
