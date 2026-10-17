import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, ref } from 'vue';

import NewTabActions from './NewTabActions.vue';
import OpenPagesList from './OpenPagesList.vue';

import MemoLinkRow from '~/app/scaffold/SidebarMenu/MemoLinkRow.vue';
import { iconKey } from '~/utils/icon';

const { openPagesStore, route, routerReplace } = vi.hoisted(() => ({
  openPagesStore: {
    tabs: { value: [{
      id: 'tab-1',
      workspaceSlug: 'workspace',
      memoSlug: 'memo' as string | null,
      routePath: undefined as string | undefined,
      hash: '',
      title: 'Parent/Memo',
      createdAt: 1,
    }] },
    activeTabIds: { value: { workspace: 'tab-1' } as Record<string, string | null> },
    activate: vi.fn(),
    close: vi.fn(),
    createTab: vi.fn(),
    reorder: vi.fn(),
  },
  route: {
    path: '/workspace/memo',
    query: {} as Record<string, string>,
  },
  routerReplace: vi.fn(async () => {}),
}));

vi.mock('pinia', () => ({
  storeToRefs: () => ({
    tabs: openPagesStore.tabs,
    activeTabIds: openPagesStore.activeTabIds,
  }),
}));

vi.mock('./openPagesStore', () => ({
  useOpenPagesStore: () => openPagesStore,
}));

vi.mock('~/app/features/memo-browsing', () => ({
  useWorkspaceMemosReadModel: vi.fn(),
}));

const ButtonStub = defineComponent({
  inheritAttrs: false,
  template: '<button v-bind="$attrs"><slot /></button>',
});

describe('OpenPagesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openPagesStore.tabs.value = [{
      id: 'tab-1',
      workspaceSlug: 'workspace',
      memoSlug: 'memo',
      routePath: undefined,
      hash: '',
      title: 'Parent/Memo',
      createdAt: 1,
    }];
    openPagesStore.activeTabIds.value = { workspace: 'tab-1' };
    route.path = '/workspace/memo';
    route.query = {};
    vi.stubGlobal('useRouter', () => ({ replace: routerReplace }));
    vi.stubGlobal('useRoute', () => route);
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('ref', ref);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the shared sidebar item styling and keeps close inside the item', () => {
    const wrapper = shallowMount(OpenPagesList, {
      props: { workspaceSlug: 'workspace' },
      global: {
        stubs: {
          AppButton: ButtonStub,
          IconButton: ButtonStub,
          SidebarMemoLabel: false,
        },
      },
    });

    const item = wrapper.get('.open-pages__drop-target');
    expect(item.classes()).toContain('is-active');
    const memoLink = wrapper.findComponent(MemoLinkRow);
    expect(memoLink.exists()).toBe(true);
    expect(memoLink.props()).toMatchObject({
      memoTitle: 'Parent/Memo',
      active: true,
    });
    expect(memoLink.attributes('aria-current')).toBe('page');
    expect(memoLink.classes()).toContain('open-pages__tab-link--selected');
    const closeOverlay = item.get('.open-pages__close');
    expect(closeOverlay.element.tagName).toBe('SPAN');
    expect(closeOverlay.find('button').exists()).toBe(true);
    expect(closeOverlay.classes()).toEqual(expect.arrayContaining([
      'absolute',
      'inset-y-0',
      'flex',
      'items-center',
    ]));
    expect(wrapper.findComponent(NewTabActions).props('workspaceSlug')).toBe('workspace');
  });

  it('navigates to an existing new-tab start page', async () => {
    openPagesStore.tabs.value = [{
      id: 'tab-new',
      workspaceSlug: 'workspace',
      memoSlug: null,
      routePath: '/_new-tab',
      hash: '',
      title: 'New tab',
      createdAt: 2,
    }];
    openPagesStore.activeTabIds.value = { workspace: 'tab-new' };

    const wrapper = shallowMount(OpenPagesList, {
      props: { workspaceSlug: 'workspace' },
      global: {
        stubs: {
          AppButton: ButtonStub,
          IconButton: ButtonStub,
          SidebarMemoLabel: false,
        },
      },
    });

    await wrapper.findComponent(MemoLinkRow).trigger('click');
    await Promise.resolve();

    expect(wrapper.findComponent(MemoLinkRow).props('icon')).toBe(iconKey.add);
    expect(routerReplace).toHaveBeenCalledWith('/workspace/_new-tab');
  });

  it.each([
    '/workspace/_focus',
    '/workspace/_bookmarks',
    '/workspace/_kanban',
  ])('shows no memo tab as active on the fixed workspace view %s', (path) => {
    route.path = path;

    const wrapper = shallowMount(OpenPagesList, {
      props: { workspaceSlug: 'workspace' },
      global: {
        stubs: {
          AppButton: ButtonStub,
          IconButton: ButtonStub,
          SidebarMemoLabel: false,
        },
      },
    });

    expect(wrapper.get('.open-pages__drop-target').classes()).not.toContain('is-active');
    expect(wrapper.findComponent(MemoLinkRow).props('active')).toBe(false);
    expect(openPagesStore.activeTabIds.value.workspace).toBe('tab-1');
  });

  it('uses the same close result as the keyboard shortcut', async () => {
    const fallbackTab = {
      id: 'tab-2',
      workspaceSlug: 'workspace',
      memoSlug: 'next',
      routePath: undefined,
      hash: '',
      title: 'Next',
      createdAt: 2,
    };
    openPagesStore.close.mockReturnValueOnce({ wasActive: true, fallbackTab });

    const wrapper = shallowMount(OpenPagesList, {
      props: { workspaceSlug: 'workspace' },
      global: {
        stubs: {
          AppButton: ButtonStub,
          IconButton: ButtonStub,
          SidebarMemoLabel: false,
        },
      },
    });

    await wrapper.get('.open-pages__close button').trigger('click');
    await Promise.resolve();

    expect(openPagesStore.close).toHaveBeenCalledWith('workspace', 'tab-1');
    expect(routerReplace).toHaveBeenCalledWith('/workspace/next');
  });

  it('returns to the fixed-view opener when its child tab closes', async () => {
    openPagesStore.close.mockReturnValueOnce({
      wasActive: true,
      fallbackTab: null,
      openerPage: { memoSlug: null, routePath: '/_focus', title: 'Focus' },
    });

    const wrapper = shallowMount(OpenPagesList, {
      props: { workspaceSlug: 'workspace' },
      global: {
        stubs: {
          AppButton: ButtonStub,
          IconButton: ButtonStub,
          SidebarMemoLabel: false,
        },
      },
    });

    await wrapper.get('.open-pages__close button').trigger('click');
    await Promise.resolve();

    expect(routerReplace).toHaveBeenCalledWith('/workspace/_focus');
  });
});
