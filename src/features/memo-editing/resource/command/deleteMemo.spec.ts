import { describe, expect, it, vi } from 'vitest';

import { deleteMemo } from './deleteMemo';

const { emitEvent, trash } = vi.hoisted(() => ({
  emitEvent: vi.fn(),
  trash: vi.fn(),
}));

vi.mock('~/resource-runtime/infra/eventBus', () => ({
  emitEvent,
}));

vi.mock('~/resources/command', () => ({
  command: {
    memo: {
      trash,
    },
  },
}));

describe('deleteMemo', () => {
  it('emits memo deleted after trashing', async () => {
    await deleteMemo({
      workspaceSlug: 'workspace',
      memoSlug: 'memo',
    });

    expect(trash).toHaveBeenCalledWith({
      workspaceSlug: 'workspace',
      memoSlug: 'memo',
    });
    expect(emitEvent).toHaveBeenCalledWith('memo/deleted', {
      workspaceSlug: 'workspace',
    });
  });
});
