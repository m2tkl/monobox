import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, nextTick, onMounted, ref, watch } from 'vue';

import SidebarMenu from './Index.vue';

const { focusListVM, openPagesStore, route, router } = vi.hoisted(() => ({
  focusListVM: {
    value: {
      data: { activeItems: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    },
  },
  openPagesStore: {
    openOrActivatePageTab: vi.fn(),
  },
  route: {
    path: '/workspace/_focus',
    params: { workspace: 'workspace', memo: '_focus' },
  },
  router: { replace: vi.fn(async () => {}) },
}));

vi.mock('~/app/features/memo-browsing', () => ({
  useFocusListReadModel: () => focusListVM,
}));

vi.mock('~/app/features/open-pages/openPagesStore', () => ({
  useOpenPagesStore: () => openPagesStore,
}));

vi.mock('./WorkspaceSwitcher.vue', () => ({
  default: { template: '<div />' },
}));

vi.mock('~/app/features/open-pages', () => ({
  OpenPagesList: { template: '<div />' },
}));

vi.mock('~/app/scaffold/ThemeToggle.vue', () => ({
  default: { template: '<div />' },
}));

const ButtonStub = defineComponent({
  props: {
    label: { type: String, default: '' },
  },
  template: '<button><span>{{ label }}</span><slot name="trailing" /></button>',
});

describe('SidebarMenu', () => {
  beforeEach(() => {
    localStorage.clear();
    focusListVM.value.data.activeItems = [{ id: 1 }, { id: 2 }, { id: 3 }];
    route.path = '/workspace/_focus';
    route.params.memo = '_focus';
    vi.clearAllMocks();
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('watch', watch);
    vi.stubGlobal('onMounted', onMounted);
    vi.stubGlobal('useRoute', () => route);
    vi.stubGlobal('useRouter', () => router);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows and navigates the active fixed Focus action without creating a tab', async () => {
    const wrapper = shallowMount(SidebarMenu, {
      props: { isOpen: true },
      global: {
        stubs: {
          AppButton: ButtonStub,
          NuxtLink: true,
          OpenPagesList: true,
          ThemeToggle: true,
          UIcon: true,
          WorkspaceSwitcher: true,
        },
      },
    });

    const focusAction = wrapper.findAll('.sidebar-primary-link')[0];
    expect(focusAction?.text()).toBe('Focus3');
    expect(focusAction?.attributes('aria-label')).toBe('Focus (3)');
    expect(focusAction?.classes()).toContain('sidebar-primary-link--active');

    await focusAction?.trigger('click');

    expect(openPagesStore.openOrActivatePageTab).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/workspace/_focus');
  });

  it('shows Files and Calendar as fixed workspace actions', () => {
    const wrapper = shallowMount(SidebarMenu, {
      props: { isOpen: true },
      global: {
        stubs: {
          AppButton: ButtonStub,
          NuxtLink: true,
          OpenPagesList: true,
          ThemeToggle: true,
          UIcon: true,
          WorkspaceSwitcher: true,
        },
      },
    });

    expect(wrapper.findAll('.sidebar-primary-link').map(item => item.text()))
      .toEqual(['Focus3', 'Bookmarks', 'Kanban', 'Files', 'Calendar']);
  });

  it('restores and persists a reordered action list', async () => {
    localStorage.setItem(
      'monobox:sidebar-action-order',
      JSON.stringify(['calendar', 'files', 'focus', 'bookmarks', 'kanban']),
    );
    const wrapper = shallowMount(SidebarMenu, {
      props: { isOpen: true },
      global: {
        stubs: {
          AppButton: ButtonStub,
          NuxtLink: true,
          OpenPagesList: true,
          ThemeToggle: true,
          UIcon: true,
          WorkspaceSwitcher: true,
        },
      },
    });
    await nextTick();

    const items = wrapper.findAll('.sidebar-primary-item');
    expect(items.map(item => item.text())).toEqual([
      'Calendar', 'Files', 'Focus3', 'Bookmarks', 'Kanban',
    ]);
    expect(items.every(item => item.attributes('draggable') === 'true')).toBe(true);

    const calendar = items[0];
    const focus = items[2];
    Object.defineProperty(focus?.element, 'getBoundingClientRect', {
      value: () => ({ top: 0, height: 20 }),
    });
    await calendar?.trigger('dragstart');
    await focus?.trigger('dragover', { clientY: 20 });
    await focus?.trigger('drop');
    await nextTick();

    expect(JSON.parse(localStorage.getItem('monobox:sidebar-action-order') ?? '[]'))
      .toEqual(['files', 'focus', 'calendar', 'bookmarks', 'kanban']);
  });
});
