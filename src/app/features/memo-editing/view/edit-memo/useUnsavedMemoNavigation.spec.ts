import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';

import { useUnsavedMemoNavigation } from './useUnsavedMemoNavigation';

import type { MemoState } from './memoMachine';

const scopes: ReturnType<typeof effectScope>[] = [];
const to = { path: '/next' };
const from = { path: '/memo' };
function setup() {
  const memoState = ref<MemoState>({ type: 'dirty' });
  const save = vi.fn(async () => {
    memoState.value = { type: 'clean' };
  });
  const scope = effectScope();
  scopes.push(scope);
  const navigation = scope.run(() => useUnsavedMemoNavigation({
    state: memoState, save,
  }))!;
  return { ...navigation, memoState, save, scope };
}
afterEach(() => scopes.splice(0).forEach(scope => scope.stop()));

describe('unsaved memo navigation', () => {
  it('permits clean and hash-only navigation but blocks leaving during a write', async () => {
    const state = setup();
    state.memoState.value = { type: 'clean' };
    expect(await state.confirmUnsavedNavigation(to, from)).toBe(true);
    state.memoState.value = { type: 'saving', mode: 'explicit' };
    expect(await state.confirmUnsavedNavigation(to, from)).toBe(false);
    expect(await state.confirmUnsavedNavigation(from, from)).toBe(true);
  });

  it.each(['cancel', 'discard', 'save'] as const)('handles %s', async (choice) => {
    const state = setup();
    const pending = state.confirmUnsavedNavigation(to, from);
    state.resolveUnsavedNavigationChoice(choice);
    expect(await pending).toBe(choice !== 'cancel');
    expect(state.save).toHaveBeenCalledTimes(choice === 'save' ? 1 : 0);
  });

  it('stays on the memo when saving fails or newer edits remain', async () => {
    const state = setup();
    state.save.mockImplementation(async () => {});
    const pending = state.confirmUnsavedNavigation(to, from);
    state.resolveUnsavedNavigationChoice('save');
    expect(await pending).toBe(false);
    state.save.mockRejectedValueOnce(new Error('Failed'));
    const retry = state.confirmUnsavedNavigation(to, from);
    state.resolveUnsavedNavigationChoice('save');
    expect(await retry).toBe(false);
    expect(state.isSavingBeforeNavigation.value).toBe(false);
  });

  it('settles an older guard when another destination is requested', async () => {
    const state = setup();
    const first = state.confirmUnsavedNavigation(to, from);
    const second = state.confirmUnsavedNavigation({ path: '/other' }, from);
    expect(await first).toBe(false);
    expect(state.isUnsavedNavigationDialogOpen.value).toBe(true);
    state.resolveUnsavedNavigationChoice('discard');
    expect(await second).toBe(true);
  });

  it('dismisses an outstanding unsaved prompt when deletion is confirmed by a resource event', async () => {
    const state = setup();
    const pending = state.confirmUnsavedNavigation(to, from);
    expect(state.isUnsavedNavigationDialogOpen.value).toBe(true);
    state.memoState.value = { type: 'deleted' };
    expect(await pending).toBe(true);
    expect(state.isUnsavedNavigationDialogOpen.value).toBe(false);
    expect(state.save).not.toHaveBeenCalled();
  });

  it('cancels pending navigation when disposed or the dialog is dismissed', async () => {
    const state = setup();
    const pending = state.confirmUnsavedNavigation(to, from);
    state.handleUnsavedNavigationDialogOpen(false);
    expect(await pending).toBe(false);
    const next = state.confirmUnsavedNavigation(to, from);
    state.scope.stop();
    expect(await next).toBe(false);
  });
});
