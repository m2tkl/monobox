import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

import type { PaletteSearchMode } from './usePaletteSearchSources';
import type { Editor } from '@tiptap/core';
import type { ManagedFileListItem } from '~/models/file';
import type { MemoIndexItem, MemoSearchItem } from '~/models/memo';

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
  description?: string;
};

export type SearchNavigationTarget = {
  memoSlug: string;
  title: string;
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
  onNavigate?: (target: SearchNavigationTarget) => void;
  mode?: Ref<PaletteSearchMode>;
  fullTextResults?: Ref<MemoSearchItem[]>;
  files?: Ref<ManagedFileListItem[]>;
  onOpenFile?: (fileId: string, title: string) => Promise<boolean>;
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

    if (options.type.value === 'search' && options.mode?.value === 'files') {
      return [{
        id: 'files', label: 'Files',
        items: (options.files?.value ?? []).map(file => ({
          label: file.display_name, title: file.display_name, slug: file.id, tag: 'file',
        })),
      }];
    }

    if (options.type.value === 'search' && options.mode?.value === 'full-text') {
      const results = searchTerm.value.trim() ? options.fullTextResults?.value ?? [] : options.memos.value;
      return [{
        id: 'full-text', label: 'Full-text results', ignoreFilter: true,
        items: results.map(memo => ({
          label: memo.title, title: memo.title, slug: memo.slug_title, tag: 'existing',
          description: ('snippet' in memo ? memo.snippet : '') || memo.description || '',
        })),
      }];
    }

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

    if (option.tag === 'file' && option.slug) {
      const opened = await options.onOpenFile?.(option.slug, option.label);
      if (opened === false) {
        selected.value = [];
        return;
      }
      closeCommandPalette([isSearchPaletteOpen]);
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
      options.onNavigate?.({
        memoSlug: linkMemoSlug,
        title: linkMemoTitle,
      });
      router.push({
        path: `/${options.workspaceSlug.value}/${linkMemoSlug}`,
        query: option.tag === 'new' ? { created: CREATED_QUERY_SOURCE_NAMED } : undefined,
      });
    }
  }

  function onSearchModeKeydown(event: KeyboardEvent) {
    if (options.type.value !== 'search' || !options.mode || !isSearchPaletteOpen.value) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.isComposing || event.keyCode === 229 || imeCommitEnterGuard.isComposing.value) return;
    if (!(event.target instanceof HTMLInputElement)) return;
    if (searchTerm.value.length > 0 || event.target.value.length > 0) return;

    const modes: PaletteSearchMode[] = ['memos', 'full-text', 'files'];
    const index = modes.indexOf(options.mode.value);
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const nextMode = modes[(index + offset + modes.length) % modes.length];
    if (!nextMode) return;

    event.preventDefault();
    event.stopPropagation();
    options.mode.value = nextMode;
    selected.value = [];
  }

  function openCommandPalette(initialTerm: string = '') {
    logger.log('openCommandPalette() start.');
    if (options.mode) options.mode.value = 'memos';
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
    onSearchModeKeydown,
    openCommandPalette,
    closeCommandPalette,
  };
};
