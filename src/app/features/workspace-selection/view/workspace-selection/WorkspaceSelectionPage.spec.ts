import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, Suspense } from 'vue';
import { createMemoryHistory, createRouter, RouterLink } from 'vue-router';

import WorkspaceSelectionPage from './WorkspaceSelectionPage.vue';

import { getTabPageLocation, NEW_TAB_PAGE } from '~/app/features/open-pages/openPages';

vi.mock('./useWorkspaceSelection', () => ({
  useWorkspaceSelection: () => ({
    workspacesReadModel: ref({
      data: { items: [
        { id: 1, name: 'Personal', slug_name: 'personal' },
        { id: 2, name: 'Work notes', slug_name: 'work_notes' },
      ] },
      flags: { isLoading: false },
    }),
    form: { state: { name: '' }, validate: vi.fn(), getValidatedState: vi.fn() },
    isCreateModalOpen: ref(false),
    createWorkspace: vi.fn(),
    isCreatingWorkspace: ref(false),
    openCreateWorkspaceModal: vi.fn(),
    resetCreateWorkspaceForm: vi.fn(),
  }),
}));
vi.mock('~/resources/workspace/queries', () => ({
  workspaceCollectionQuery: { fetch: vi.fn().mockResolvedValue([]) },
}));

const wrappers: ReturnType<typeof mount>[] = [];
beforeEach(() => {
  vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
  vi.stubGlobal('usePageLoader', async (load: () => Promise<void>) => load());
});
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  vi.unstubAllGlobals();
});

describe('workspace selection', () => {
  it.each(['personal', 'work_notes'])('opens the same start page as Home for %s', async (slug) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/:workspace', name: 'memos', component: { template: '<div />' } },
        { path: '/:workspace/_new-tab', name: 'home', component: { template: '<div />' } },
      ],
    });
    vi.stubGlobal('useRouter', () => router);
    await router.push('/');
    await router.isReady();
    const container = defineComponent({ template: '<div><slot /><slot name="actions" /></div>' });
    const wrapper = mount(defineComponent({
      setup: () => () => h(Suspense, null, { default: () => h(WorkspaceSelectionPage) }),
    }), {
      global: {
        plugins: [router],
        stubs: {
          NuxtLayout: container, AppPageFrame: container, AppPageHeader: container,
          NuxtLink: RouterLink, AppButton: true, UModal: true, AppInput: true, UFormField: true, UForm: true,
        },
      },
    });
    wrappers.push(wrapper);
    await flushPromises();
    const link = wrapper.findAllComponents(RouterLink).find(item => String(item.props('to')).includes(slug))!;
    await link.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(getTabPageLocation(slug, NEW_TAB_PAGE));
    expect(router.currentRoute.value.name).toBe('home');
  });
});
