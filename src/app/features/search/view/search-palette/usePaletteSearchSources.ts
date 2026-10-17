import { onBeforeUnmount, ref, watch, type Ref } from 'vue';

import { searchMemos } from '../../resource/read/searchMemos';

import type { ManagedFileListItem } from '~/models/file';
import type { MemoSearchItem } from '~/models/memo';

import { command } from '~/resources/command';

export type PaletteSearchMode = 'memos' | 'full-text' | 'files';

export function usePaletteSearchSources(options: {
  enabled: Ref<boolean>;
  open: Ref<boolean>;
  mode: Ref<PaletteSearchMode>;
  query: Ref<string>;
  workspaceSlug: Ref<string>;
  fullTextResults?: Ref<MemoSearchItem[]>;
  files?: Ref<ManagedFileListItem[]>;
}) {
  const fullTextResults = options.fullTextResults ?? ref<MemoSearchItem[]>([]);
  const files = options.files ?? ref<ManagedFileListItem[]>([]);
  const isLoading = ref(false);
  const error = ref('');
  let requestId = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  watch([options.enabled, options.open, options.mode,
    () => options.mode.value === 'full-text' ? options.query.value : '', options.workspaceSlug],
  ([enabled, open, mode, query, slug]) => {
    const id = ++requestId;
    clearTimeout(timer);
    fullTextResults.value = [];
    files.value = [];
    isLoading.value = false;
    error.value = '';
    if (!enabled || !open || !slug || mode === 'memos') return;
    if (mode === 'full-text' && !query.trim()) return;
    isLoading.value = true;
    timer = setTimeout(async () => {
      try {
        if (mode === 'full-text') {
          const results = await searchMemos(slug, query.trim());
          if (id === requestId) fullTextResults.value = results;
        }
        else {
          const items: ManagedFileListItem[] = [];
          let offset = 0;
          while (id === requestId) {
            const page = await command.file.listFiles({ limit: 100, offset });
            items.push(...page.items);
            offset += page.items.length;
            if (!page.items.length || offset >= page.total_count) break;
          }
          if (id === requestId) files.value = items;
        }
      }
      catch {
        if (id === requestId) error.value = 'Search failed. Please try again.';
      }
      finally {
        if (id === requestId) isLoading.value = false;
      }
    }, mode === 'full-text' ? 300 : 0);
  }, { immediate: true });

  onBeforeUnmount(() => {
    ++requestId;
    clearTimeout(timer);
  });

  return { fullTextResults, files, isLoading, error };
}
