import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';

import { usePaletteSearchSources, type PaletteSearchMode } from './usePaletteSearchSources';

const { searchMemos, listFiles } = vi.hoisted(() => ({ searchMemos: vi.fn(), listFiles: vi.fn() }));
vi.mock('../../resource/read/searchMemos', () => ({ searchMemos }));
vi.mock('~/resources/command', () => ({ command: { file: { listFiles } } }));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

function setup(modeValue: PaletteSearchMode) {
  const mode = ref(modeValue);
  const query = ref('contents');
  let sources!: ReturnType<typeof usePaletteSearchSources>;
  const wrapper = mount(defineComponent({
    setup() {
      sources = usePaletteSearchSources({ enabled: ref(true), open: ref(true), mode, query, workspaceSlug: ref('workspace') });
      return () => null;
    },
  }));
  return { wrapper, sources, mode, query };
}

describe('palette search sources', () => {
  it('debounces full-text searches and discards a response after switching modes', async () => {
    vi.useFakeTimers();
    let resolve!: (value: unknown[]) => void;
    searchMemos.mockImplementation(() => new Promise(r => resolve = r));
    const { wrapper, sources, mode } = setup('full-text');
    await vi.advanceTimersByTimeAsync(300);
    expect(searchMemos).toHaveBeenCalledWith('workspace', 'contents');
    mode.value = 'memos';
    await nextTick();
    resolve([{ title: 'Stale result' }]);
    await Promise.resolve();
    expect(sources.fullTextResults.value).toEqual([]);
    expect(sources.isLoading.value).toBe(false);
    wrapper.unmount();
  });

  it('loads every file page once without reloading while the name query changes', async () => {
    vi.useFakeTimers();
    listFiles.mockResolvedValueOnce({ items: [{ id: 'one' }], total_count: 2 });
    listFiles.mockResolvedValueOnce({ items: [{ id: 'two' }], total_count: 2 });
    const { wrapper, sources, query } = setup('files');
    await vi.advanceTimersByTimeAsync(0);
    expect(sources.files.value.map(file => file.id)).toEqual(['one', 'two']);
    query.value = 'report';
    await nextTick();
    expect(listFiles).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });
});
