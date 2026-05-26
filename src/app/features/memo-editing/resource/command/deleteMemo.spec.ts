import { describe, expect, it, vi } from 'vitest';

import { deleteMemo } from './deleteMemo';

const { publishResourceChanges, trash } = vi.hoisted(() => ({
  publishResourceChanges: vi.fn(),
  trash: vi.fn(),
}));

vi.mock('~/resource-runtime/query-runtime', () => ({
  publishResourceChanges,
}));

vi.mock('~/resources/command', () => ({
  command: {
    memo: {
      trash,
    },
  },
}));

vi.mock('~/resources/changes', () => ({
  changeRefs: {
    memoDeleted: vi.fn((workspaceSlug: string, memoSlug: string) => ({ type: 'memoDeleted', workspaceSlug, memoSlug })),
  },
}));

describe('deleteMemo', () => {
  it('publishes memo deletion after trashing', async () => {
    await deleteMemo({
      workspaceSlug: 'workspace',
      memoSlug: 'memo',
    });

    expect(trash).toHaveBeenCalledWith({
      workspaceSlug: 'workspace',
      memoSlug: 'memo',
    });
    expect(publishResourceChanges).toHaveBeenCalledWith([
      { type: 'memoDeleted', workspaceSlug: 'workspace', memoSlug: 'memo' },
    ]);
  });
});
