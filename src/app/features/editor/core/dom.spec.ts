import { describe, it, expect } from 'vitest';

import { getLinkFromMouseClickEvent } from './dom';

describe('editor/core/dom', () => {
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
