import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, onMounted, onUnmounted, reactive, ref } from 'vue';

import TitleBar from './TitleBar.vue';

import { useOpenPagesStore } from '~/app/features/open-pages/openPagesStore';
import { SearchPalette } from '~/app/features/search';
import { iconKey } from '~/utils/icon';

const { current, router } = vi.hoisted(() => ({
  current: { path: '/', hash: '', workspace: '' },
  router: { push: vi.fn(), replace: vi.fn(), go: vi.fn() },
}));
vi.mock('~/app/features/open-pages/useTabShortcuts', () => ({ useTabShortcuts: vi.fn() }));
vi.mock('~/app/features/memo-browsing', () => ({
  useWorkspaceMemosReadModel: () => ref({ data: { items: [{ slug_title: 'random', title: 'Random' }] } }),
}));
vi.mock('~/app/scaffold/useTitleBarWorkspace', () => ({
  useTitleBarWorkspace: () => ({
    route: reactive(current),
    workspaceSlug: computed(() => reactive(current).workspace),
    memoTitleSlug: ref(''),
    workspaceReadModel: ref({ data: { workspace: null } }),
  }),
}));
vi.mock('~/app/features/search', () => ({
  SearchPalette: { template: '<div />' },
  registerSearchLauncher: () => vi.fn(),
}));
vi.mock('~/app/features/memo-editing/view/bookmark-memo/BookmarkButton.vue', () => ({
  default: { template: '<div />' },
}));
vi.mock('~/app/scaffold/WindowControls.vue', () => ({
  default: {
    props: ['placement'],
    template: '<div class="window-controls" :data-placement="placement" />',
  },
}));

const wrappers: ReturnType<typeof mount>[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  Object.assign(current, { path: '/', hash: '', workspace: '' });
  vi.stubGlobal('ref', ref);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('onMounted', onMounted);
  vi.stubGlobal('onUnmounted', onUnmounted);
  vi.stubGlobal('useRouter', () => router);
  vi.stubGlobal('useUIState', () => ({ ui: reactive({ isSidebarOpen: false }), toggleSidebar: vi.fn() }));
  vi.stubGlobal('iconKey', iconKey);
});
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  vi.unstubAllGlobals();
});

function renderTitleBar() {
  const button = defineComponent({
    props: ['icon', 'disabled'], emits: ['click'],
    template: '<button :data-icon="icon" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  });
  const wrapper = mount(TitleBar, { global: {
    mocks: { iconKey },
    stubs: {
      IconButton: button, AppButton: button,
      AppButtonGroup: { template: '<div><slot /></div>' },
    },
  } });
  wrappers.push(wrapper);
  return wrapper;
}

describe('TitleBar', () => {
  it.each(['memo', '_focus', '_bookmarks', '_kanban', '_files', '_calendar'])(
    'opens search from %s in a new tab without replacing an existing unpinned tab',
    (source) => {
      const store = useOpenPagesStore();
      const pinned = store.createTab('personal', { memoSlug: 'memo', title: 'Memo' });
      store.pinTab('personal', pinned);
      const preview = store.createTab('personal', { memoSlug: 'preview', title: 'Preview' });
      if (source === 'memo') store.activate('personal', pinned);
      Object.assign(current, { path: `/personal/${source}`, workspace: 'personal' });
      const wrapper = renderTitleBar();

      wrapper.findComponent(SearchPalette).vm.$emit('navigate', { memoSlug: 'result', title: 'Result' }, 'current-tab');

      expect(store.tabs.find(tab => tab.id === preview)?.memoSlug).toBe('preview');
      expect(store.tabs).toHaveLength(3);
      expect(store.tabs.find(tab => tab.id === store.activeTabIds.personal)?.memoSlug).toBe('result');
    },
  );

  it('opens a random memo from a fixed view without overwriting a previous tab', async () => {
    const store = useOpenPagesStore();
    const preview = store.createTab('personal', { memoSlug: 'preview', title: 'Preview' });
    Object.assign(current, { path: '/personal/_focus', workspace: 'personal' });
    const wrapper = renderTitleBar();

    await wrapper.get('[aria-label="Random memo"]').trigger('click');

    expect(store.tabs.find(tab => tab.id === preview)?.memoSlug).toBe('preview');
    expect(store.tabs).toHaveLength(2);
    expect(router.push).toHaveBeenCalledWith('/personal/random');
  });

  it('shows only window controls and drag regions on workspace selection', () => {
    const wrapper = renderTitleBar();
    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(wrapper.findAll('.window-controls')).toHaveLength(2);
    expect(wrapper.find('[data-tauri-drag-region]').exists()).toBe(true);
  });

  it('retains workspace navigation and Home', async () => {
    Object.assign(current, { path: '/personal/_new-tab', workspace: 'personal' });
    const wrapper = renderTitleBar();
    expect(wrapper.find('[aria-label="Back"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Forward"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="New memo"]').exists()).toBe(true);
    expect(wrapper.find(`[data-icon="${iconKey.sidebarOpen}"]`).exists()).toBe(true);
    await wrapper.get('[aria-label="Home"]').trigger('click');
    expect(router.push).toHaveBeenCalledWith('/personal/_new-tab');
  });

  it('keeps browser back available on app settings without workspace controls', async () => {
    current.path = '/_setting';
    const wrapper = renderTitleBar();
    await wrapper.get('[aria-label="Back"]').trigger('click');
    expect(router.go).toHaveBeenCalledWith(-1);
    expect(wrapper.find(`[data-icon="${iconKey.sidebarOpen}"]`).exists()).toBe(false);
    expect(wrapper.find(`[data-icon="${iconKey.database}"]`).exists()).toBe(false);
  });
});
