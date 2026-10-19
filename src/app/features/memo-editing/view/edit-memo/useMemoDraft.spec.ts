import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useMemoDraft } from './useMemoDraft';

describe('memo draft', () => {
  const initial = { title: 'A', content: '{}' };
  it('compares current edits with the actual saved snapshot', () => {
    let current = { ...initial };
    const draft = useMemoDraft({
      initial, getCurrentSnapshot: () => current, applyExternalSnapshot: vi.fn(),
    });
    current = { title: 'B', content: '{}' };
    draft.recordSavedSnapshot(initial);
    expect(draft.computeDirty()).toBe(true);
    draft.recordSavedSnapshot(current);
    expect(draft.computeDirty()).toBe(false);
  });

  it('treats title whitespace consistently with persistence', () => {
    const draft = useMemoDraft({
      initial,
      getCurrentSnapshot: () => ({ ...initial, title: '  A  ' }),
      applyExternalSnapshot: vi.fn(),
    });
    expect(draft.computeDirty()).toBe(false);
  });

  it('applies external content only to an idle, unedited document', async () => {
    let current = { ...initial };
    const apply = vi.fn((snapshot) => {
      current = snapshot;
    });
    const draft = useMemoDraft({ initial, getCurrentSnapshot: () => current, applyExternalSnapshot: apply });
    const external = { title: 'External', content: '{}' };
    draft.receiveExternalSnapshot(external, true);
    expect(apply).not.toHaveBeenCalled();
    expect(draft.pendingExternalSnapshot.value).toEqual(external);
    draft.receiveExternalSnapshot(external, false);
    expect(current).toEqual(external);
    expect(draft.computeDirty()).toBe(false);
    expect(draft.isApplyingExternalSnapshot.value).toBe(true);
    await nextTick();
    expect(draft.isApplyingExternalSnapshot.value).toBe(false);
    current = { title: 'Local edit', content: '{}' };
    draft.receiveExternalSnapshot(initial, false);
    expect(current.title).toBe('Local edit');
    expect(draft.pendingExternalSnapshot.value).toEqual(initial);
  });

  it('does not record invalid external content as saved', async () => {
    const draft = useMemoDraft({
      initial, getCurrentSnapshot: () => initial,
      applyExternalSnapshot: () => { throw new Error('Invalid content'); },
    });
    expect(() => draft.receiveExternalSnapshot({ title: 'Invalid', content: 'invalid' }, false)).toThrow();
    expect(draft.computeDirty()).toBe(false);
    await nextTick();
    expect(draft.isApplyingExternalSnapshot.value).toBe(false);
  });
});
