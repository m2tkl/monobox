import { describe, expect, it } from 'vitest';

import { apply, type MemoState } from './memoMachine';

describe('memo editing machine', () => {
  it('starts an explicit save from dirty state', () => {
    const result = apply(
      { type: 'dirty' },
      { type: 'memo/save-requested', payload: { mode: 'explicit' } },
    );

    expect(result).toEqual({
      state: {
        type: 'saving',
        mode: 'explicit',
      },
      effects: [{ type: 'effect/save-memo', mode: 'explicit' }],
    });
  });

  it('requests delete confirmation from dirty state without save-before-delete branch', () => {
    const result = apply(
      { type: 'dirty' },
      { type: 'memo/delete-requested' },
    );

    expect(result).toEqual({
      state: { type: 'dirty' },
      effects: [{ type: 'effect/confirm-delete' }],
    });
  });

  it('returns to prior editable state when delete fails', () => {
    const previous: MemoState = { type: 'dirty' };
    const result = apply(
      { type: 'deleting', returnState: previous },
      { type: 'memo/delete-failed', payload: {} },
    );

    expect(result).toEqual({
      state: previous,
      effects: [],
    });
  });
});
