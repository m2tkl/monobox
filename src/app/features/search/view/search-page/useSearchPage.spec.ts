import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, reactive } from 'vue';

import { useSearchPage } from './useSearchPage';

const { searchMemos } = vi.hoisted(() => ({
  searchMemos: vi.fn(),
}));

vi.mock('../../resource/read/searchMemos', () => ({
  searchMemos,
}));

vi.mock('~/app/features/memo-browsing', () => ({
  useWorkspaceMemosReadModel: () => computed(() => ({
    data: {
      items: [],
    },
  })),
}));

vi.mock('~/utils/logger', () => ({
  useConsoleLogger: () => ({
    warn: vi.fn(),
  }),
}));

describe('useSearchPage', () => {
  const routerReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const mountSearchPage = (initialQuery = '') => {
    const route = reactive({
      path: '/workspace/_search',
      hash: '',
      params: { workspace: 'workspace' },
      query: initialQuery ? { q: initialQuery } : {},
    });

    routerReplace.mockImplementation(async ({ query }: { query: Record<string, string> }) => {
      route.query = query;
    });

    vi.stubGlobal('useRoute', () => route);
    vi.stubGlobal('useRouter', () => ({ replace: routerReplace }));

    let page!: ReturnType<typeof useSearchPage>;

    const TestComponent = defineComponent({
      setup() {
        page = useSearchPage();
        return page;
      },
      template: '<div />',
    });

    const wrapper = mount(TestComponent);

    return {
      wrapper,
      page,
      route,
    };
  };

  it('initializes the search field from the route query and fetches results', async () => {
    searchMemos.mockResolvedValue([
      {
        id: 1,
        slug_title: 'alpha',
        title: 'Alpha',
        description: '',
        snippet: 'matched snippet',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        modified_at: '2024-01-01T00:00:00Z',
      },
    ]);

    const { wrapper, page } = mountSearchPage('alpha');

    expect(page.query.value).toBe('alpha');

    await vi.advanceTimersByTimeAsync(400);

    expect(searchMemos).toHaveBeenCalledWith('workspace', 'alpha');
    expect(page.results.value).toEqual([
      expect.objectContaining({
        title: 'Alpha',
        description: 'matched snippet',
      }),
    ]);

    wrapper.unmount();
  });

  it('syncs query changes back to the route query and clears it when emptied', async () => {
    const { wrapper, page, route } = mountSearchPage();

    page.query.value = 'beta';
    await Promise.resolve();

    expect(routerReplace).toHaveBeenLastCalledWith({
      path: '/workspace/_search',
      query: { q: 'beta' },
      hash: '',
    });
    expect(route.query).toEqual({ q: 'beta' });

    page.clearQuery();
    await Promise.resolve();

    expect(routerReplace).toHaveBeenLastCalledWith({
      path: '/workspace/_search',
      query: {},
      hash: '',
    });
    expect(route.query).toEqual({});

    wrapper.unmount();
  });

  it('restores cached results immediately when returning with the same query', async () => {
    searchMemos.mockResolvedValue([
      {
        id: 1,
        slug_title: 'alpha',
        title: 'Alpha',
        description: '',
        snippet: 'matched snippet',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        modified_at: '2024-01-01T00:00:00Z',
      },
    ]);

    const firstMount = mountSearchPage('cached-alpha');
    await vi.advanceTimersByTimeAsync(400);
    expect(searchMemos).toHaveBeenCalledTimes(1);
    firstMount.wrapper.unmount();

    searchMemos.mockClear();

    const secondMount = mountSearchPage('cached-alpha');

    expect(secondMount.page.query.value).toBe('cached-alpha');
    expect(secondMount.page.results.value).toEqual([
      expect.objectContaining({
        title: 'Alpha',
        description: 'matched snippet',
      }),
    ]);
    expect(searchMemos).not.toHaveBeenCalled();

    secondMount.wrapper.unmount();
  });
});
