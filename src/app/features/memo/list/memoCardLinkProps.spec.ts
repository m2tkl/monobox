import { describe, expect, it } from 'vitest';

import { memoCardLinkAttrs, memoCardLinkClass } from './memoCardLinkProps';

describe('memoCardLinkProps', () => {
  it('disables native link dragging for memo cards', () => {
    expect(memoCardLinkAttrs.draggable).toBe(false);
    expect(memoCardLinkAttrs.class).toBe(memoCardLinkClass);
    expect(memoCardLinkClass).toContain('block');
    expect(memoCardLinkClass).toContain('h-full');
  });
});
