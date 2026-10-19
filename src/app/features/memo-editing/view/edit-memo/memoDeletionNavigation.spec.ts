import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, onScopeDispose, ref, shallowRef } from 'vue';
import { createMemoryHistory, createRouter, onBeforeRouteLeave, RouterView, useRoute, useRouter } from 'vue-router';

import { useMemoDraft } from './useMemoDraft';
import { useMemoMachine } from './useMemoMachine';
import { useUnsavedMemoNavigation } from './useUnsavedMemoNavigation';
import { createMemo } from '../../resource/command/createMemo';

import { useOpenPageTracking } from '~/app/features/open-pages/useOpenPageTracking';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

const { trash, create, openPages } = vi.hoisted(() => ({
  trash: vi.fn(),
  create: vi.fn(),
  openPages: {
    tabs: [], activeTabIds: {},
    reconcileDeletedMemo: vi.fn(() => null),
    openInActiveTab: vi.fn(),
    openOrActivatePageTab: vi.fn(),
    discardFixedWorkspaceViewTabs: vi.fn(),
    setActiveTabOpener: vi.fn(),
  },
}));

vi.mock('~/resources/command', () => ({ command: { memo: { trash, create } } }));
vi.mock('~/resources/kanban/globalStatus', () => ({ loadGlobalStatusKanban: async () => null }));
vi.mock('~/app/features/open-pages/openPagesStore', () => ({ useOpenPagesStore: () => openPages }));
vi.mock('~/app/features/memo-browsing', () => ({
  useWorkspaceMemosReadModel: () => ref({ data: { items: [] } }),
}));

const wrappers: ReturnType<typeof mount>[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  trash.mockResolvedValue(undefined);
  create.mockResolvedValue({ title: 'New memo', slug_title: 'new-memo', content: '""' });
  vi.stubGlobal('useRoute', useRoute);
  vi.stubGlobal('useRouter', useRouter);
  vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
  vi.stubGlobal('useConsoleLogger', () => ({ error: vi.fn() }));
  vi.stubGlobal('iconKey', { success: 'success', failed: 'failed' });
});
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  vi.unstubAllGlobals();
});

async function openNewMemo(confirmDelete = true) {
  const memo = await createMemo({ workspaceSlug: 'workspace', title: 'New memo' });
  let machine!: ReturnType<typeof useMemoMachine>;
  let navigation!: ReturnType<typeof useUnsavedMemoNavigation>;
  let editor!: Editor;
  let draft!: ReturnType<typeof useMemoDraft>;
  const MemoPage = defineComponent({
    setup() {
      const router = useRouter();
      const title = ref(memo.title);
      editor = new Editor({
        extensions: [StarterKit],
        content: JSON.parse(memo.content),
        onUpdate: () => {
          void machine.dispatch({ type: 'memo/content-updated', payload: { dirty: draft.computeDirty() } });
        },
      });
      const getCurrentSnapshot = () => ({ title: title.value, content: JSON.stringify(editor.getJSON()) });
      draft = useMemoDraft({
        initial: memo, getCurrentSnapshot,
        applyExternalSnapshot: snapshot => editor.commands.setContent(JSON.parse(snapshot.content), false),
      });
      machine = useMemoMachine({
        initialState: { type: 'clean' }, workspaceSlug: ref('workspace'), memoSlug: ref(memo.slug_title),
        router, route: { hash: '' }, editor: shallowRef(editor), memoTitle: title, headImageRef: ref(null),
        deleteDialogRef: ref({ confirm: async () => confirmDelete }),
        getCurrentSnapshot, onSnapshotSaved: draft.recordSavedSnapshot,
      });
      navigation = useUnsavedMemoNavigation({
        state: machine.state,
        save: () => machine.dispatch({ type: 'memo/save-requested', payload: { mode: 'navigation' } }),
      });
      onBeforeRouteLeave(navigation.confirmUnsavedNavigation);
      onScopeDispose(() => editor.destroy());
      return () => h('div', 'Memo');
    },
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:workspace/:memo', component: MemoPage },
      { path: '/:workspace', component: { render: () => h('div', 'Workspace') } },
    ],
  });
  await router.push('/workspace/new-memo');
  await router.isReady();
  const wrapper = mount(defineComponent({
    setup() {
      useOpenPageTracking();
      return () => h(RouterView);
    },
  }), { global: { plugins: [router] } });
  wrappers.push(wrapper);
  await flushPromises();
  return { router, machine, navigation, editor, draft };
}

describe('new memo deletion and navigation', () => {
  it('leaves an untouched new memo without treating editor initialization as an edit', async () => {
    const { router, navigation, draft } = await openNewMemo();
    expect(draft.computeDirty()).toBe(true); // persisted empty string becomes an editor document
    const pending = router.push('/workspace');
    await flushPromises();
    expect(navigation.isUnsavedNavigationDialogOpen.value).toBe(false);
    await pending;
    expect(router.currentRoute.value.path).toBe('/workspace');
  });

  it.each([false, true])('deletes a newly created memo and follows the deletion notification (edited: %s)', async (edited) => {
    const { router, machine, navigation, editor } = await openNewMemo();
    if (edited) editor.commands.insertContent('Unsaved text');
    await machine.dispatch({ type: 'memo/delete-requested' });
    await flushPromises();
    expect(trash).toHaveBeenCalledWith({ workspaceSlug: 'workspace', memoSlug: 'new-memo' });
    expect(navigation.isUnsavedNavigationDialogOpen.value).toBe(false);
    expect(router.currentRoute.value.path).toBe('/workspace');
  });

  it('handles deletion in another window but ignores deletion of a different memo', async () => {
    const { router, machine, navigation, editor } = await openNewMemo();
    editor.commands.insertContent('Unsaved text');
    await publishResourceChanges([changeRefs.memoDeleted('workspace', 'other-memo')]);
    expect(machine.state.value.type).toBe('dirty');
    expect(router.currentRoute.value.path).toBe('/workspace/new-memo');
    await publishResourceChanges([changeRefs.memoDeleted('workspace', 'new-memo')]);
    await flushPromises();
    expect(navigation.isUnsavedNavigationDialogOpen.value).toBe(false);
    expect(router.currentRoute.value.path).toBe('/workspace');
  });

  it.each(['failed', 'cancelled'])('keeps unsaved protection after deletion is %s', async (outcome) => {
    const { router, machine, navigation, editor } = await openNewMemo(outcome !== 'cancelled');
    editor.commands.insertContent('Unsaved text');
    if (outcome === 'failed') trash.mockRejectedValueOnce(new Error('Failed'));
    await machine.dispatch({ type: 'memo/delete-requested' });
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/workspace/new-memo');
    const pending = router.push('/workspace');
    await flushPromises();
    expect(navigation.isUnsavedNavigationDialogOpen.value).toBe(true);
    navigation.resolveUnsavedNavigationChoice('cancel');
    await pending;
    expect(router.currentRoute.value.path).toBe('/workspace/new-memo');
  });
});
