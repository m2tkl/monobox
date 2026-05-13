import { afterEach, describe, expect, it, vi } from 'vitest';

import { saveMemo } from './saveMemo';

import type { Editor } from '@tiptap/core';

const { emitEvent, save } = vi.hoisted(() => ({
  emitEvent: vi.fn(),
  save: vi.fn(),
}));

vi.mock('~/resource-runtime/infra/eventBus', () => ({
  emitEvent,
}));

vi.mock('~/resources/command', () => ({
  command: {
    memo: {
      save,
    },
  },
}));

describe('saveMemo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emits memo updated after saving', async () => {
    vi.stubGlobal('encodeForSlug', (value: string) => value.toLowerCase().replaceAll(' ', '-'));
    vi.stubGlobal('truncateString', (value: string) => value);

    const editor = {
      getJSON: () => ({ type: 'doc' }),
      getText: () => 'memo text',
    } as Editor;

    await saveMemo(
      {
        workspaceSlug: 'workspace',
        memoSlug: 'old-slug',
      },
      editor,
      'New title',
      '',
      '#hash',
    );

    expect(save).toHaveBeenCalledWith({
      workspaceSlug: 'workspace',
      memoSlug: 'old-slug',
    }, {
      slugTitle: 'new-title',
      title: 'New title',
      content: JSON.stringify({ type: 'doc' }),
      description: 'memo text',
      thumbnailImage: '',
    });
    expect(emitEvent).toHaveBeenCalledWith('memo/updated', {
      workspaceSlug: 'workspace',
      memoSlug: 'new-title',
    });
  });
});
