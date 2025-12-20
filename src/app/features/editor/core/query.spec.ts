import { describe, it, expect } from 'vitest';

import { getHeadingTextById } from './query';

import type { JSONContent } from '@tiptap/vue-3';

describe('editor/core/query', () => {
  it('getHeadingTextById returns heading text for matching id', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { id: 'a', level: 1 }, content: [{ type: 'text', text: 'Hello' }] },
        { type: 'heading', attrs: { id: 'b', level: 2 }, content: [{ type: 'text', text: 'World' }] },
      ],
    } as const;

    expect(getHeadingTextById(json, 'a')).toBe('Hello');
    expect(getHeadingTextById(json, 'c')).toBeNull();
    expect(getHeadingTextById(json, 'b')).toBe('World');
  });
});
