import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';

import { useTabShortcuts } from './useTabShortcuts';

import { isMac } from '~/utils/platform';

const { store, router, route } = vi.hoisted(() => ({
  store: {
    tabs: [
      { id: 'first', workspaceSlug: 'workspace', memoSlug: 'memo', hash: '#heading' },
      { id: 'other', workspaceSlug: 'other', memoSlug: 'other-memo' },
      { id: 'files', workspaceSlug: 'workspace', memoSlug: null, routePath: '/_files' },
      { id: 'empty', workspaceSlug: 'workspace', memoSlug: null, routePath: '/_new-tab' },
    ],
    activeTabIds: { workspace: 'first' },
    activate: vi.fn(),
    createTab: vi.fn(),
    close: vi.fn(),
    restoreLastClosed: vi.fn(),
  },
  router: { push: vi.fn(), replace: vi.fn() },
  route: { path: '/workspace/memo', query: {} },
}));

vi.mock('./openPagesStore', () => ({ useOpenPagesStore: () => store }));

const Harness = defineComponent({
  setup() {
    useTabShortcuts(ref('workspace'));
    return () => null;
  },
});

describe('tab keyboard shortcuts', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    vi.clearAllMocks();
    store.activeTabIds.workspace = 'first';
    route.path = '/workspace/memo';
    vi.stubGlobal('useRouter', () => router);
    vi.stubGlobal('useRoute', () => route);
    wrapper = mount(Harness);
  });

  afterEach(() => {
    wrapper.unmount();
    vi.unstubAllGlobals();
  });

  async function press(shiftKey = false) {
    const event = new KeyboardEvent('keydown', { key: 'Tab', ctrlKey: true, shiftKey, cancelable: true });
    window.dispatchEvent(event);
    await Promise.resolve();
    return event;
  }

  async function pressPrimary(key: string, shiftKey = false) {
    const event = new KeyboardEvent('keydown', {
      key,
      metaKey: isMac,
      ctrlKey: !isMac,
      shiftKey,
      cancelable: true,
    });
    window.dispatchEvent(event);
    await Promise.resolve();
    return event;
  }

  it('opens the next tab in sidebar order, excluding other workspaces', async () => {
    const event = await press();
    expect(event.defaultPrevented).toBe(true);
    expect(store.activate).toHaveBeenCalledWith('workspace', 'files');
    expect(router.replace).toHaveBeenCalledWith('/workspace/_files');
  });

  it('wraps backwards to the new-tab start page', async () => {
    await press(true);
    expect(store.activate).toHaveBeenCalledWith('workspace', 'empty');
    expect(router.replace).toHaveBeenCalledWith('/workspace/_new-tab');
  });

  it('wraps forwards and preserves the memo heading', async () => {
    store.activeTabIds.workspace = 'empty';
    await press();
    expect(store.activate).toHaveBeenCalledWith('workspace', 'first');
    expect(router.replace).toHaveBeenCalledWith('/workspace/memo#heading');
  });

  it('ignores Tab without Ctrl and removes the listener on unmount', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    wrapper.unmount();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', ctrlKey: true }));
    expect(store.activate).not.toHaveBeenCalled();
  });

  it('opens a new tab with the primary modifier and T', async () => {
    const event = await pressPrimary('t');

    expect(event.defaultPrevented).toBe(true);
    expect(store.createTab).toHaveBeenCalledWith('workspace');
    expect(router.replace).toHaveBeenCalledWith('/workspace/_new-tab');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('closes the active tab and navigates to the next tab', async () => {
    store.close.mockReturnValueOnce({
      wasActive: true,
      fallbackTab: store.tabs[2],
    });
    const event = await pressPrimary('w');

    expect(event.defaultPrevented).toBe(true);
    expect(store.close).toHaveBeenCalledWith('workspace', 'first');
    expect(router.replace).toHaveBeenCalledWith('/workspace/_files');
  });

  it('returns to the fixed-view opener when closing its child tab', async () => {
    store.close.mockReturnValueOnce({
      wasActive: true,
      fallbackTab: store.tabs[2],
      openerPage: { memoSlug: null, routePath: '/_kanban', title: 'Kanban' },
    });

    await pressPrimary('w');

    expect(router.replace).toHaveBeenCalledWith('/workspace/_kanban');
  });

  it('does not close the hidden memo tab from a fixed workspace view', async () => {
    route.path = '/workspace/_focus';

    const event = await pressPrimary('w');

    expect(event.defaultPrevented).toBe(true);
    expect(store.close).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('restores the last closed tab with the primary modifier, Shift, and T', async () => {
    store.restoreLastClosed.mockReturnValueOnce(store.tabs[0]);
    const event = await pressPrimary('T', true);

    expect(event.defaultPrevented).toBe(true);
    expect(store.restoreLastClosed).toHaveBeenCalledWith('workspace');
    expect(router.replace).toHaveBeenCalledWith('/workspace/memo#heading');
  });
});
