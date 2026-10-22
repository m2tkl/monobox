import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, nextTick, reactive, ref } from 'vue';

import { useOpenPageTracking } from './useOpenPageTracking';

import type { OpenTab, TabPage } from './openPages';

import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

const { openPages, routerReplace, useWorkspaceMemosReadModel } = vi.hoisted(() => ({
  openPages: {
    tabs: [] as OpenTab[],
    activeTabIds: {} as Record<string, string | null>,
    discardFixedWorkspaceViewTabs: vi.fn(),
    openOrActivatePageTab: vi.fn(),
    openInActiveTab: vi.fn(),
    setActiveTabOpener: vi.fn(),
    reconcileDeletedMemo: vi.fn(),
    reconcileRenamedMemo: vi.fn(),
  },
  routerReplace: vi.fn(async () => {}),
  useWorkspaceMemosReadModel: vi.fn(),
}));

vi.mock('./openPagesStore', () => ({
  useOpenPagesStore: () => openPages,
}));

vi.mock('~/app/features/memo-browsing', () => ({
  useWorkspaceMemosReadModel,
}));

describe('useOpenPageTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openPages.tabs = [
      {
        id: 'first-tab',
        workspaceSlug: 'workspace',
        memoSlug: 'first',
        hash: '',
        title: 'First page',
        createdAt: 1,
      },
      {
        id: 'second-tab',
        workspaceSlug: 'workspace',
        memoSlug: 'second',
        hash: '',
        title: 'Second page',
        createdAt: 2,
      },
    ];
    openPages.activeTabIds = { workspace: 'first-tab' };
    openPages.reconcileDeletedMemo.mockReturnValue(null);
    vi.stubGlobal('useRouter', () => ({ replace: routerReplace }));
    openPages.openInActiveTab.mockImplementation((workspaceSlug: string, page: TabPage) => {
      const activeTabId = openPages.activeTabIds[workspaceSlug];
      const activeTab = openPages.tabs.find(tab => tab.id === activeTabId);
      if (activeTab) Object.assign(activeTab, page);
    });
    openPages.openOrActivatePageTab.mockImplementation((workspaceSlug: string, page: TabPage) => {
      const existingTab = openPages.tabs.find(tab => (
        tab.workspaceSlug === workspaceSlug
        && tab.memoSlug === page.memoSlug
        && tab.routePath === page.routePath
      ));
      if (existingTab) {
        openPages.activeTabIds[workspaceSlug] = existingTab.id;
        return existingTab.id;
      }
      const id = `tab-${page.routePath ?? page.memoSlug}`;
      openPages.tabs.push({
        id,
        workspaceSlug,
        memoSlug: page.memoSlug,
        routePath: page.routePath,
        hash: page.hash ?? '',
        title: page.title,
        createdAt: 3,
      });
      openPages.activeTabIds[workspaceSlug] = id;
      return id;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not write the previous route title into a newly selected tab', async () => {
    const route = reactive({
      fullPath: '/workspace/first',
      path: '/workspace/first',
      params: { workspace: 'workspace', memo: 'first' },
      query: {},
      hash: '',
    });
    const memoItems = ref([
      { slug_title: 'first', title: 'First page' },
      { slug_title: 'second', title: 'Second page' },
    ]);
    useWorkspaceMemosReadModel.mockReturnValue(computed(() => ({
      data: { items: memoItems.value },
    })));
    vi.stubGlobal('useRoute', () => route);

    const wrapper = mount(defineComponent({
      setup() {
        useOpenPageTracking();
      },
      template: '<div />',
    }));
    await nextTick();

    openPages.activeTabIds.workspace = 'second-tab';
    memoItems.value = [...memoItems.value];
    await nextTick();

    expect(openPages.tabs[1]?.title).toBe('Second page');
    wrapper.unmount();
  });

  it('tracks workspace tools as tab pages', async () => {
    const route = reactive({
      fullPath: '/workspace/_search',
      path: '/workspace/_search',
      params: { workspace: 'workspace', memo: '_search' },
      query: {},
      hash: '',
    });
    useWorkspaceMemosReadModel.mockReturnValue(computed(() => ({
      data: { items: [] },
    })));
    vi.stubGlobal('useRoute', () => route);

    const wrapper = mount(defineComponent({
      setup() {
        useOpenPageTracking();
      },
      template: '<div />',
    }));
    await nextTick();

    expect(openPages.openInActiveTab).toHaveBeenCalledWith('workspace', {
      memoSlug: null,
      routePath: '/_search',
      title: 'Full search',
    });
    wrapper.unmount();
  });

  it.each([
    {
      name: 'Focus',
      fullPath: '/workspace/_focus',
      path: '/workspace/_focus',
      params: { workspace: 'workspace', memo: '_focus' },
      query: {},
      page: { memoSlug: null, routePath: '/_focus', title: 'Focus' },
    },
    {
      name: 'Bookmarks',
      fullPath: '/workspace/_bookmarks',
      path: '/workspace/_bookmarks',
      params: { workspace: 'workspace', memo: '_bookmarks' },
      query: {},
      page: { memoSlug: null, routePath: '/_bookmarks', title: 'Bookmarks' },
    },
    {
      name: 'Kanban',
      fullPath: '/workspace/_kanban',
      path: '/workspace/_kanban',
      params: { workspace: 'workspace', memo: '_kanban' },
      query: {},
      page: { memoSlug: null, routePath: '/_kanban', title: 'Kanban' },
    },
    {
      name: 'Files',
      fullPath: '/workspace/_files',
      path: '/workspace/_files',
      params: { workspace: 'workspace', memo: '_files' },
      query: {},
      page: { memoSlug: null, routePath: '/_files', title: 'Files' },
    },
    {
      name: 'Calendar',
      fullPath: '/workspace/_calendar',
      path: '/workspace/_calendar',
      params: { workspace: 'workspace', memo: '_calendar' },
      query: {},
      page: { memoSlug: null, routePath: '/_calendar', title: 'Calendar' },
    },
  ])('keeps $name out of the memo tabs', async ({ fullPath, path, params, query }) => {
    const route = reactive({ fullPath, path, params, query, hash: '' });
    useWorkspaceMemosReadModel.mockReturnValue(computed(() => ({
      data: { items: [] },
    })));
    vi.stubGlobal('useRoute', () => route);

    const wrapper = mount(defineComponent({
      setup() {
        useOpenPageTracking();
      },
      template: '<div />',
    }));
    await nextTick();

    expect(openPages.discardFixedWorkspaceViewTabs).toHaveBeenCalledWith('workspace');
    expect(openPages.openOrActivatePageTab).not.toHaveBeenCalled();
    expect(openPages.openInActiveTab).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('opens a selected Kanban memo in its own tab without replacing the previous memo tab', async () => {
    const route = reactive({
      fullPath: '/workspace/_kanban',
      path: '/workspace/_kanban',
      params: { workspace: 'workspace', memo: '_kanban' },
      query: {},
      hash: '',
    });
    useWorkspaceMemosReadModel.mockReturnValue(computed(() => ({
      data: { items: [{ slug_title: 'selected', title: 'Selected memo' }] },
    })));
    vi.stubGlobal('useRoute', () => route);

    const wrapper = mount(defineComponent({
      setup() {
        useOpenPageTracking();
      },
      template: '<div />',
    }));
    await nextTick();

    route.path = '/workspace/selected';
    route.fullPath = route.path;
    route.params.memo = 'selected';
    await nextTick();

    expect(openPages.discardFixedWorkspaceViewTabs).toHaveBeenCalledWith('workspace');
    expect(openPages.openOrActivatePageTab).toHaveBeenCalledWith('workspace', {
      memoSlug: 'selected',
      hash: '',
      title: 'Selected memo',
    });
    expect(openPages.setActiveTabOpener).toHaveBeenCalledWith(
      'workspace',
      'tab-selected',
      { memoSlug: null, routePath: '/_kanban', hash: '', title: 'Kanban' },
    );
    expect(openPages.openInActiveTab).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('opens an individual file in a tab whose opener is the fixed Files view', async () => {
    const route = reactive({
      fullPath: '/workspace/_files',
      path: '/workspace/_files',
      params: { workspace: 'workspace', memo: '_files' },
      query: {},
      hash: '',
    });
    useWorkspaceMemosReadModel.mockReturnValue(computed(() => ({
      data: { items: [] },
    })));
    vi.stubGlobal('useRoute', () => route);

    const wrapper = mount(defineComponent({
      setup() {
        useOpenPageTracking();
      },
      template: '<div />',
    }));
    await nextTick();

    route.path = '/workspace/_files/file-id';
    route.fullPath = route.path;
    route.params.memo = '_files';
    await nextTick();

    expect(openPages.openOrActivatePageTab).toHaveBeenCalledWith('workspace', {
      memoSlug: null,
      routePath: '/_files/file-id',
      title: 'File',
    });
    expect(openPages.setActiveTabOpener).toHaveBeenCalledWith(
      'workspace',
      'tab-/_files/file-id',
      { memoSlug: null, routePath: '/_files', hash: '', title: 'Files' },
    );
    wrapper.unmount();
  });

  it('projects a memoRenamed fact before tracking the new route', async () => {
    vi.stubGlobal('useRoute', () => ({
      fullPath: '/workspace/first',
      path: '/workspace/first',
      params: { workspace: 'workspace', memo: 'first' },
      query: {},
      hash: '',
    }));
    useWorkspaceMemosReadModel.mockReturnValue(computed(() => ({
      data: { items: [{ slug_title: 'first', title: 'First page' }] },
    })));
    const wrapper = mount(defineComponent({
      setup() { useOpenPageTracking(); },
      template: '<div />',
    }));

    await publishResourceChanges([
      changeRefs.memoRenamed('workspace', 'first', 'renamed'),
    ], { notifyOtherWindows: false });
    expect(openPages.reconcileRenamedMemo).toHaveBeenCalledWith('workspace', 'first', 'renamed');
    wrapper.unmount();
  });

  it('projects a memoDeleted fact into open-page state and navigation', async () => {
    const route = reactive({
      fullPath: '/workspace/first',
      path: '/workspace/first',
      params: { workspace: 'workspace', memo: 'first' },
      query: {},
      hash: '',
    });
    useWorkspaceMemosReadModel.mockReturnValue(computed(() => ({
      data: { items: [{ slug_title: 'first', title: 'First page' }] },
    })));
    openPages.reconcileDeletedMemo.mockReturnValue({
      wasActive: true,
      fallbackTab: openPages.tabs[1],
      openerPage: null,
    });
    vi.stubGlobal('useRoute', () => route);

    const wrapper = mount(defineComponent({
      setup() {
        useOpenPageTracking();
      },
      template: '<div />',
    }));
    await nextTick();

    await publishResourceChanges([
      changeRefs.memoDeleted('workspace', 'first'),
    ], { notifyOtherWindows: false });

    expect(openPages.reconcileDeletedMemo).toHaveBeenCalledWith('workspace', 'first');
    expect(routerReplace).toHaveBeenCalledWith('/workspace/second');
    wrapper.unmount();

    openPages.reconcileDeletedMemo.mockClear();
    await publishResourceChanges([
      changeRefs.memoDeleted('workspace', 'first'),
    ], { notifyOtherWindows: false });
    expect(openPages.reconcileDeletedMemo).not.toHaveBeenCalled();
  });
});
