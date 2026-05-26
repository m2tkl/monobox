import { afterEach, describe, expect, it, vi } from 'vitest';

import { saveMemo } from './saveMemo';

import type { Editor } from '@tiptap/core';

const { publishResourceChanges, save } = vi.hoisted(() => ({
  publishResourceChanges: vi.fn(),
  save: vi.fn(),
}));

vi.mock('~/resource-runtime/query-runtime', () => ({
  publishResourceChanges,
}));

vi.mock('~/resources/command', () => ({
  command: {
    memo: {
      save,
    },
  },
}));

vi.mock('~/resources/changes', () => ({
  changeRefs: {
    memoChanged: vi.fn((workspaceSlug: string, memoSlug: string) => ({ type: 'memoChanged', workspaceSlug, memoSlug })),
    memoRenamed: vi.fn((workspaceSlug: string, previousMemoSlug: string, memoSlug: string) => ({
      type: 'memoRenamed',
      workspaceSlug,
      previousMemoSlug,
      memoSlug,
    })),
  },
}));

describe('saveMemo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('publishes memo changes after saving', async () => {
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
    expect(publishResourceChanges).toHaveBeenCalledWith([
      { type: 'memoChanged', workspaceSlug: 'workspace', memoSlug: 'new-title' },
      { type: 'memoRenamed', workspaceSlug: 'workspace', previousMemoSlug: 'old-slug', memoSlug: 'new-title' },
    ]);
  });
});
