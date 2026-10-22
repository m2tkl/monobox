import { shallowMount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import OpenPagesList from './OpenPagesList.vue';
import { useOpenPagesStore } from './openPagesStore';

vi.mock('~/app/features/memo-browsing', () => ({
  useWorkspaceMemosReadModel: vi.fn(),
}));

describe('tab pinning interaction', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps single-clicked tabs italic and pins a tab on double-click', async () => {
    const pinia = createPinia();
    const store = useOpenPagesStore(pinia);
    const tabId = store.createTab('workspace', { memoSlug: 'memo', title: 'Memo' });
    const replace = vi.fn();
    vi.stubGlobal('useRoute', () => ({ path: '/workspace/memo', query: {} }));
    vi.stubGlobal('useRouter', () => ({ replace }));
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('ref', ref);
    const wrapper = shallowMount(OpenPagesList, {
      props: { workspaceSlug: 'workspace' },
      global: {
        plugins: [pinia],
        stubs: {
          MemoLinkRow: false,
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const link = wrapper.get('a.open-pages__tab-link');
    expect(link.classes()).toContain('open-pages__tab-link--preview');
    await link.trigger('click');
    expect(store.tabs[0]?.isPinned).toBe(false);
    expect(replace).toHaveBeenCalledWith('/workspace/memo');
    await link.trigger('click');
    await link.trigger('dblclick');
    expect(store.tabs[0]).toMatchObject({ id: tabId, isPinned: true });
    expect(link.classes()).not.toContain('open-pages__tab-link--preview');
    expect(store.tabs).toHaveLength(1);
    await link.trigger('dblclick');
    expect(store.tabs[0]?.isPinned).toBe(true);
    wrapper.unmount();
  });
});
