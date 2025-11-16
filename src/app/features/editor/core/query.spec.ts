import { describe, it, expect } from 'vitest';

import { getHeadingTextById, getLinkFromMouseClickEvent } from './query';

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

  it('getLinkFromMouseClickEvent extracts href from nearest anchor', () => {
    const anchor = document.createElement('a');
    anchor.href = '/foo';

    const span = document.createElement('span');
    anchor.appendChild(span);

    document.body.appendChild(anchor);

    let result: string | undefined;
    span.addEventListener('click', (e) => {
      result = getLinkFromMouseClickEvent(e);
    });

    span.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(result).toBe('/foo');
  });
});
