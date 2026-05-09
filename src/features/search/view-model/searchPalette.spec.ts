import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref, type Ref } from 'vue';

import { useSearchPalette } from './searchPalette';

import type { MemoIndexItem } from '~/models/memo';

const { createMemo, emitEvent } = vi.hoisted(() => ({
  createMemo: vi.fn(),
  emitEvent: vi.fn(),
}));

vi.mock('~/resources/command', () => ({
  command: {
    memo: {
      create: createMemo,
    },
  },
}));

vi.mock('~/resource-runtime/infra/eventBus', () => ({
  emitEvent,
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

  const mountPalette = (memos: MemoIndexItem[], initialTerm: string) => {
    let palette!: PaletteState;
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
    expect(emitEvent).toHaveBeenCalledWith('memo/created', { workspaceSlug: 'workspace' });

    wrapper.unmount();
  });
});
