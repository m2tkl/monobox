import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';

import { useMemoMachine, type DeleteMemoDialogHandle } from './useMemoMachine';

import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';

const {
  deleteMemo,
  saveMemo,
  syncMemoLinks,
} = vi.hoisted(() => ({
  deleteMemo: vi.fn(),
  saveMemo: vi.fn(),
  syncMemoLinks: vi.fn(),
}));

vi.mock('../../resource/command/deleteMemo', () => ({
  deleteMemo,
}));

vi.mock('../../resource/command/saveMemo', () => ({
  saveMemo,
}));

vi.mock('../../resource/command/syncMemoLinks', () => ({
  syncMemoLinks,
}));

describe('useMemoMachine', () => {
  const toastAdd = vi.fn();
  const routerReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('iconKey', {
      success: 'success',
      failed: 'failed',
    });
    vi.stubGlobal('useToast', () => ({
      add: toastAdd,
    }));
    vi.stubGlobal('useConsoleLogger', () => ({
      error: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mountMachine = (options: {
    initialState?: 'clean' | 'dirty';
    confirmDelete?: boolean;
  } = {}) => {
    const workspaceSlug = ref('workspace');
    const memoSlug = ref('memo');
    const memoTitle = ref('Memo title');
    const headImageRef = ref<string | null | undefined>(null);
    const editor = ref<Editor | undefined>({ getJSON: () => ({ type: 'doc' }) } as Editor);
    const deleteDialogRef = ref<DeleteMemoDialogHandle | null>({
      confirm: vi.fn().mockResolvedValue(options.confirmDelete ?? true),
    });
    const onSnapshotSaved = vi.fn();
    const getCurrentSnapshot = vi.fn(() => ({
      title: memoTitle.value,
      content: JSON.stringify(editor.value?.getJSON() ?? {}),
    }));

    let machine!: ReturnType<typeof useMemoMachine>;

    const TestComponent = defineComponent({
      setup() {
        machine = useMemoMachine({
          initialState: { type: options.initialState ?? 'clean' },
          workspaceSlug,
          memoSlug,
          router: { replace: routerReplace } as never,
          route: { hash: '#section' },
          editor: editor as Ref<Editor | undefined>,
          memoTitle,
          headImageRef,
          deleteDialogRef,
          getCurrentSnapshot,
          onSnapshotSaved,
        });

        return {};
      },
      template: '<div />',
    });

    const wrapper = mount(TestComponent);

    return {
      wrapper,
      machine,
      workspaceSlug,
      memoSlug,
      deleteDialogRef,
      onSnapshotSaved,
      getCurrentSnapshot,
    };
  };

  it('redispatches a save request after syncing links', async () => {
    syncMemoLinks.mockResolvedValue(undefined);
    saveMemo.mockResolvedValue({ memoSlug: 'saved-memo' });

    const { wrapper, machine, onSnapshotSaved } = mountMachine({ initialState: 'dirty' });

    await machine.dispatch({
      type: 'memo/links-changed',
      payload: { added: ['linked-memo'], deleted: ['old-memo'] },
    });

    expect(syncMemoLinks).toHaveBeenCalledWith({
      workspaceSlug: 'workspace',
      memoSlug: 'memo',
    }, ['linked-memo'], ['old-memo']);
    expect(saveMemo).toHaveBeenCalledWith(
      {
        workspaceSlug: 'workspace',
        memoSlug: 'memo',
      },
      expect.any(Object),
      'Memo title',
      '',
      '#section',
    );
    expect(machine.state.value).toEqual({ type: 'clean' });
    expect(onSnapshotSaved).toHaveBeenCalledWith({
      title: 'Memo title',
      content: JSON.stringify({ type: 'doc' }),
    });
    expect(routerReplace).toHaveBeenCalledWith('/workspace/saved-memo#section');

    wrapper.unmount();
  });

  it('completes an explicit save without a success toast', async () => {
    saveMemo.mockResolvedValue({ memoSlug: 'saved-memo' });

    const { wrapper, machine } = mountMachine({ initialState: 'dirty' });

    await machine.dispatch({
      type: 'memo/save-requested',
      payload: { mode: 'explicit' },
    });

    expect(machine.state.value).toEqual({ type: 'clean' });
    expect(toastAdd).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('saves for navigation without replacing the current memo route', async () => {
    saveMemo.mockResolvedValue({ memoSlug: 'saved-memo' });

    const { wrapper, machine, onSnapshotSaved } = mountMachine({ initialState: 'dirty' });

    await machine.dispatch({
      type: 'memo/save-requested',
      payload: { mode: 'navigation' },
    });

    expect(machine.state.value).toEqual({ type: 'clean' });
    expect(onSnapshotSaved).toHaveBeenCalledWith({
      title: 'Memo title',
      content: JSON.stringify({ type: 'doc' }),
    });
    expect(routerReplace).not.toHaveBeenCalled();
    expect(toastAdd).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('shows the save failure toast when navigation save fails', async () => {
    saveMemo.mockRejectedValue(new Error('failed'));

    const { wrapper, machine } = mountMachine({ initialState: 'dirty' });

    await machine.dispatch({
      type: 'memo/save-requested',
      payload: { mode: 'navigation' },
    });

    expect(machine.state.value).toEqual({ type: 'dirty' });
    expect(toastAdd).toHaveBeenCalledWith({
      title: 'Failed to save',
      description: 'Please try again',
      color: 'error',
      icon: 'failed',
    });

    wrapper.unmount();
  });

  it('redispatches the delete confirmation result and completes deletion', async () => {
    deleteMemo.mockResolvedValue(undefined);

    const { wrapper, machine, deleteDialogRef } = mountMachine();

    await machine.dispatch({ type: 'memo/delete-requested' });

    expect(deleteDialogRef.value?.confirm).toHaveBeenCalledOnce();
    expect(deleteMemo).toHaveBeenCalledWith({
      workspaceSlug: 'workspace',
      memoSlug: 'memo',
    });
    expect(machine.state.value).toEqual({ type: 'clean' });
    expect(routerReplace).toHaveBeenCalledWith('/workspace');
    expect(toastAdd).toHaveBeenCalledWith({
      title: 'Delete memo successfully.',
      icon: 'success',
      duration: 1000,
    });

    wrapper.unmount();
  });
});
