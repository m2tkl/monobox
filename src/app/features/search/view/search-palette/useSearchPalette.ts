import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

import type { Editor } from '@tiptap/core';
import type { MemoIndexItem } from '~/models/memo';

import * as EditorAction from '~/app/features/editor/core/action';
import * as EditorQuery from '~/app/features/editor/core/query';
import { CREATED_QUERY_SOURCE_NAMED } from '~/app/features/memo-editing/createdQuery';
import { createMemo } from '~/app/features/memo-editing/resource/command/createMemo';
import { useImeCommitEnterGuard } from '~/composables/useImeCommitEnterGuard';
import { isCmdKey } from '~/utils/event';
import { useConsoleLogger } from '~/utils/logger';
import { encodeForSlug } from '~/utils/slug';

type Command = {
  label: string;
  tag: string;
  title?: string;
  slug?: string;
};

type Commands = {
  id: string;
  label: string;
  ignoreFilter?: boolean;
  items: Command[];
};

function isCommand(item: unknown): item is Command {
  if (!item || typeof item !== 'object') {
    return false;
  }
  return 'tag' in item;
}

function isShortcutHandled(event: KeyboardEvent) {
  return (event as KeyboardEvent & { __monoboxSearchPaletteHandled?: boolean }).__monoboxSearchPaletteHandled === true;
}

function markShortcutHandled(event: KeyboardEvent) {
  (event as KeyboardEvent & { __monoboxSearchPaletteHandled?: boolean }).__monoboxSearchPaletteHandled = true;
}

export type UseSearchPaletteOptions = {
  type: Ref<'search' | 'link'>;
  workspaceSlug: Ref<string>;
  memos: Ref<MemoIndexItem[]>;
  currentMemoSlug?: Ref<string | undefined>;
  currentMemoTitle?: Ref<string | undefined>;
  editor?: Ref<Editor | undefined>;
  shortcutSymbol: Ref<string>;
};

export const useSearchPalette = (options: UseSearchPaletteOptions) => {
  const router = useRouter();
  const logger = useConsoleLogger('components/Search/SearchPalette');
  const selected = ref<unknown[]>([]);
  const isSearchPaletteOpen = ref(false);
  const searchTerm = ref('');
  const imeCommitEnterGuard = useImeCommitEnterGuard({
    isActive: () => isSearchPaletteOpen.value,
    onSuppress: () => {
      selected.value = [];
    },
  });

  const isCurrentMemoPageLink = (slug: string | undefined) =>
    options.type.value === 'link'
    && slug != null
    && slug === options.currentMemoSlug?.value;

  const commandPaletteItems = computed<Commands[]>(() => {
    if (!options.memos?.value) return [];

    const existingMemos = options.memos.value
      .toSorted()
      .filter(memo => !isCurrentMemoPageLink(memo.slug_title))
      .map(memo => ({ ...memo, label: memo.title }));

    const linkPaletteCommands: Commands[] = [{
      id: 'existing-memos',
      label: 'Existing memos',
      items: existingMemos.map(memo => ({
        label: memo.title,
        title: memo.title,
        slug: memo.slug_title,
        tag: 'existing',
      })),
    }];

    const query = searchTerm.value;
    if (query && !existingMemos.map(memo => memo.title).includes(query)) {
      linkPaletteCommands.push({
        id: 'new',
        label: 'Or new memo',
        ignoreFilter: true,
        items: [{ label: query, title: query, tag: 'new' }],
      });
    }

    return linkPaletteCommands;
  });

  async function onSearchPaletteSelect(option: unknown) {
    logger.log('onSearchPaletteSelect() start.');

    if (imeCommitEnterGuard.isComposing.value || imeCommitEnterGuard.isInsideCommitWindow()) {
      selected.value = [];
      logger.log('onSearchPaletteSelect() skipped during IME composition.');
      return;
    }

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

    let linkMemoSlug = option.slug || encodeForSlug(option.label);
    let linkMemoTitle = option.label;

    if (isCurrentMemoPageLink(linkMemoSlug)) {
      closeCommandPalette([isSearchPaletteOpen]);
      logger.log('onSearchPaletteSelect() skipped current memo link.');
      return;
    }

    if (option.tag === 'new') {
      const newMemo = await createMemo({
        workspaceSlug: options.workspaceSlug.value,
        title: searchTerm.value,
      });

      linkMemoSlug = newMemo.slug_title;
      linkMemoTitle = newMemo.title;
    }

    if (options.type.value === 'link') {
      if (options.editor?.value) {
        EditorAction.insertLinkToMemo(options.editor.value, linkMemoTitle, `/${options.workspaceSlug.value}/${linkMemoSlug}`);
      }
    }

    await nextTick();
    closeCommandPalette([isSearchPaletteOpen]);

    logger.log('onSearchPaletteSelect() end.');

    if (options.type.value === 'search') {
      router.push({
        path: `/${options.workspaceSlug.value}/${linkMemoSlug}`,
        query: option.tag === 'new' ? { created: CREATED_QUERY_SOURCE_NAMED } : undefined,
      });
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
      if (isShortcutHandled(event)) {
        return;
      }

      markShortcutHandled(event);
      event.preventDefault();

      const selectedText = options.editor?.value ? EditorQuery.getSelectedTextV2(options.editor.value.view) : '';
      const parentPath = options.currentMemoTitle?.value ? extractParentPathFromTitle(options.currentMemoTitle.value) : '';
      const initialTerm = selectedText || parentPath || '';

      openCommandPalette(initialTerm);
      return;
    }

    if (event.key === 'Escape' && isSearchPaletteOpen.value) {
      closeCommandPalette([isSearchPaletteOpen]);
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeydownShortcut);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydownShortcut);
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
