import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref, type Ref } from 'vue';

import { useSearchPalette } from './useSearchPalette';

import type { MemoIndexItem } from '~/models/memo';

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
    vi.stubGlobal('defineShortcuts', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mountPalette = (memos: MemoIndexItem[], initialTerm: string) => {
    let palette: PaletteState | null = null;
    const shortcutSymbol = ref('k');

    const TestComponent = defineComponent({
      setup() {
        palette = useSearchPalette({
          type: ref<'search' | 'link'>('search'),
          workspaceSlug: ref('workspace'),
          memos: ref(memos),
          shortcutSymbol: shortcutSymbol as Ref<string>,
        });

        return palette;
      },
      template: '<div />',
    });

    const wrapper = mount(TestComponent);

    if (!palette) throw new Error('Failed to initialize palette');

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
});
