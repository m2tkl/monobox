import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref, type Ref } from 'vue';

import { useSearchPalette } from './useSearchPalette';

import type { MemoIndexItem } from '~/models/memo';

import * as EditorAction from '~/app/features/editor/core/action';

const { createMemo, publishResourceChanges } = vi.hoisted(() => ({
  createMemo: vi.fn(),
  publishResourceChanges: vi.fn(),
}));

vi.mock('~/resources/command', () => ({
  command: {
    memo: {
      create: createMemo,
    },
    kanban: {
      list: vi.fn(async () => []),
    },
  },
}));

vi.mock('~/resource-runtime/query-runtime', () => ({
  publishResourceChanges,
}));

vi.mock('~/resources/changes', () => ({
  changeRefs: {
    memoCreated: vi.fn((workspaceSlug: string, memoSlug: string) => ({ type: 'memoCreated', workspaceSlug, memoSlug })),
    kanbanAssignmentCollectionChanged: vi.fn(),
  },
}));

type PaletteState = ReturnType<typeof useSearchPalette>;

const makeMemo = (overrides: Partial<MemoIndexItem> = {}): MemoIndexItem => ({
  id: 1,
  slug_title: 'alpha',
  title: 'Alpha',
  description: 'desc',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  modified_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('useSearchPalette', () => {
  const routerPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('useRouter', () => ({ push: routerPush }));
    createMemo.mockResolvedValue({
      id: 10,
      slug_title: 'gamma',
      title: 'Gamma',
      content: '""',
      workspace_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      modified_at: '2024-01-01T00:00:00Z',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const insertLinkToMemo = vi.spyOn(EditorAction, 'insertLinkToMemo').mockImplementation(() => {});

  const mountPalette = (
    memos: MemoIndexItem[],
    initialTerm: string,
    overrides: Partial<Parameters<typeof useSearchPalette>[0]> = {},
  ) => {
    let palette!: PaletteState;
    const shortcutSymbol = ref('k');

    const TestComponent = defineComponent({
      setup() {
        palette = useSearchPalette({
          type: ref<'search' | 'link'>('search'),
          workspaceSlug: ref('workspace'),
          memos: ref(memos),
          shortcutSymbol: shortcutSymbol as Ref<string>,
          ...overrides,
        });

        return palette;
      },
      template: '<div />',
    });

    const wrapper = mount(TestComponent);

    palette.openCommandPalette(initialTerm);

    return { wrapper, palette };
  };

  it('shows existing memos before the create option', () => {
    const { wrapper, palette } = mountPalette([
      makeMemo({ id: 1, title: 'Alpha', slug_title: 'alpha' }),
      makeMemo({ id: 2, title: 'Beta', slug_title: 'beta' }),
    ], 'Gamma');

    expect(palette.commandPaletteItems.value.map(group => group.id)).toEqual(['existing-memos', 'new']);
    expect(palette.commandPaletteItems.value[1]?.ignoreFilter).toBe(true);
    expect(palette.commandPaletteItems.value[1]?.items[0]?.tag).toBe('new');

    wrapper.unmount();
  });

  it('does not show the create option for an exact existing title', () => {
    const { wrapper, palette } = mountPalette([
      makeMemo({ id: 1, title: 'Alpha', slug_title: 'alpha' }),
    ], 'Alpha');

    expect(palette.commandPaletteItems.value.map(group => group.id)).toEqual(['existing-memos']);

    wrapper.unmount();
  });

  it('does not show the current memo in link mode', () => {
    const { wrapper, palette } = mountPalette([
      makeMemo({ id: 1, title: 'Alpha', slug_title: 'alpha' }),
      makeMemo({ id: 2, title: 'Beta', slug_title: 'beta' }),
    ], '', {
      type: ref<'search' | 'link'>('link'),
      currentMemoSlug: ref('alpha'),
    });

    expect(palette.commandPaletteItems.value[0]?.items.map(item => item.slug)).toEqual(['beta']);

    wrapper.unmount();
  });

  it('does not insert a link to the current memo', async () => {
    const { wrapper, palette } = mountPalette([
      makeMemo({ id: 1, title: 'Alpha', slug_title: 'alpha' }),
    ], 'Alpha', {
      type: ref<'search' | 'link'>('link'),
      currentMemoSlug: ref('alpha'),
      editor: ref({ commands: { focus: vi.fn() } } as never),
    });

    await palette.onSearchPaletteSelect({
      label: 'Alpha',
      title: 'Alpha',
      slug: 'alpha',
      tag: 'existing',
    });

    expect(insertLinkToMemo).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('inserts a link to a heading in the current memo', async () => {
    const { wrapper, palette } = mountPalette([
      makeMemo({ id: 1, title: 'Alpha', slug_title: 'alpha' }),
    ], 'Section', {
      type: ref<'search' | 'link'>('link'),
      currentMemoSlug: ref('alpha'),
      editor: ref({ commands: { focus: vi.fn() } } as never),
    });

    await palette.onSearchPaletteSelect({
      label: 'Section',
      title: 'Section',
      slug: 'alpha#section',
      tag: 'existing',
    });

    expect(insertLinkToMemo).toHaveBeenCalledWith(
      expect.anything(),
      'Section',
      '/workspace/alpha#section',
    );
    expect(routerPush).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('routes with the created flag after creating a memo from the search palette', async () => {
    const { wrapper, palette } = mountPalette([], 'Gamma');

    await palette.onSearchPaletteSelect({
      label: 'Gamma',
      title: 'Gamma',
      tag: 'new',
    });

    expect(createMemo).toHaveBeenCalledWith({
      workspaceSlugName: 'workspace',
      title: 'Gamma',
    });
    expect(routerPush).toHaveBeenCalledWith({
      path: '/workspace/gamma',
      query: { created: 'named' },
    });
    expect(publishResourceChanges).toHaveBeenCalledWith([
      { type: 'memoCreated', workspaceSlug: 'workspace', memoSlug: 'gamma' },
    ]);

    wrapper.unmount();
  });

  it('does not select a command from an Enter keydown immediately after IME composition ends', async () => {
    const { wrapper } = mountPalette([
      makeMemo({ id: 1, title: 'Alpha', slug_title: 'alpha' }),
    ], 'Alpha');
    const compositionEnd = new CompositionEvent('compositionend', {
      bubbles: true,
      cancelable: true,
    });
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    const stopImmediatePropagation = vi.spyOn(enter, 'stopImmediatePropagation');

    window.dispatchEvent(compositionEnd);
    window.dispatchEvent(enter);

    await Promise.resolve();

    expect(enter.defaultPrevented).toBe(true);
    expect(stopImmediatePropagation).toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('skips model selection immediately after IME composition ends', async () => {
    const { wrapper, palette } = mountPalette([
      makeMemo({ id: 1, title: 'Alpha', slug_title: 'alpha' }),
    ], 'Alpha');

    window.dispatchEvent(new CompositionEvent('compositionend'));
    await palette.onSearchPaletteSelect({
      label: 'Alpha',
      title: 'Alpha',
      slug: 'alpha',
      tag: 'existing',
    });

    expect(routerPush).not.toHaveBeenCalled();
    expect(palette.selected.value).toEqual([]);

    wrapper.unmount();
  });
});
