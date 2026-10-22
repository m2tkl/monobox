import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, ref } from 'vue';
import { createMemoryHistory, createRouter, RouterLink, useRoute, useRouter } from 'vue-router';

import OpenPagesList from './OpenPagesList.vue';
import { useOpenPagesStore } from './openPagesStore';
import { useOpenPageTracking } from './useOpenPageTracking';

import { useSearchPalette } from '~/app/features/search/view/search-palette/useSearchPalette';

vi.mock('~/app/features/memo-browsing', () => ({
  useWorkspaceMemosReadModel: () => computed(() => ({ data: { items: [] } })),
}));

describe('pinned tab route navigation', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(['_focus', '_bookmarks', '_kanban', '_files', '_calendar'])(
    'keeps existing unpinned tabs when following a link from %s',
    async (source) => {
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/:workspace/:memo', component: { template: '<div />' } }],
      });
      await router.push(`/work/${source}`);
      const pinia = createPinia();
      const store = useOpenPagesStore(pinia);
      const preview = store.createTab('work', { memoSlug: 'preview', title: 'Preview' });
      vi.stubGlobal('useRoute', useRoute);
      vi.stubGlobal('useRouter', useRouter);
      const wrapper = mount(defineComponent({
        components: { RouterLink },
        setup() { useOpenPageTracking(); },
        template: '<RouterLink to="/work/result">Result</RouterLink>',
      }), { global: { plugins: [pinia, router] } });

      await wrapper.get('a').trigger('click');
      await flushPromises();
      expect(store.tabs.find(tab => tab.id === preview)?.memoSlug).toBe('preview');
      expect(store.tabs).toHaveLength(2);
      expect(store.activeTabIds.work).not.toBe(preview);
      wrapper.unmount();
    },
  );

  it('preserves existing tabs when following links after pinning and reselecting a tab', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:workspace/:memo', component: { template: '<div />' } }],
    });
    await router.push('/work/first');
    const pinia = createPinia();
    const store = useOpenPagesStore(pinia);
    vi.stubGlobal('useRoute', useRoute);
    vi.stubGlobal('useRouter', useRouter);
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('ref', ref);
    let palette!: ReturnType<typeof useSearchPalette>;
    const wrapper = mount(defineComponent({
      components: { OpenPagesList, RouterLink },
      setup() {
        useOpenPageTracking();
        palette = useSearchPalette({
          type: ref('search'),
          workspaceSlug: ref('work'),
          memos: ref([]),
          shortcutSymbol: ref('k'),
          onNavigate: target => store.openInActiveTab('work', target),
        });
      },
      template: '<div><OpenPagesList workspace-slug="work" /><RouterLink class="memo-link" to="/work/second">Second</RouterLink></div>',
    }), {
      global: {
        plugins: [pinia, router],
        stubs: { NuxtLink: RouterLink, AppIcon: true, IconButton: true, NewTabActions: true },
      },
    });
    const firstId = store.activeTabIds.work;
    const firstLink = wrapper.get('.open-pages__tab-link');
    await firstLink.trigger('click');
    await firstLink.trigger('click');
    await firstLink.trigger('dblclick');
    await flushPromises();
    expect(store.tabs[0]?.isPinned).toBe(true);
    await wrapper.get('.memo-link').trigger('click');
    await flushPromises();
    const secondId = store.activeTabIds.work;
    expect(secondId).not.toBe(firstId);
    expect(store.tabs.map(tab => tab.memoSlug)).toEqual(['first', 'second']);
    await wrapper.findAll('.open-pages__tab-link')[0]!.trigger('click');
    await flushPromises();
    expect(store.activeTabIds.work).toBe(firstId);
    await router.push('/work/third');
    await flushPromises();
    expect(store.tabs.map(tab => tab.memoSlug)).toEqual(['first', 'second', 'third']);
    expect(store.tabs.find(tab => tab.id === secondId)?.memoSlug).toBe('second');
    await wrapper.findAll('.open-pages__tab-link')[0]!.trigger('click');
    await flushPromises();
    palette.openCommandPalette('fourth');
    await palette.onSearchPaletteSelect({ label: 'Fourth', slug: 'fourth', tag: 'memo' });
    await flushPromises();
    expect(store.tabs.map(tab => tab.memoSlug)).toEqual(['first', 'second', 'third', 'fourth']);
    wrapper.unmount();
  });
});
