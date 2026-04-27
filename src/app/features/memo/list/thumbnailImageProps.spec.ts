import { describe, expect, it } from 'vitest';

import { thumbnailImageAttrs, thumbnailImageClass } from './thumbnailImageProps';

describe('thumbnailImageProps', () => {
  it('marks thumbnail images as display-only so parent containers keep handling pointer input', () => {
    expect(thumbnailImageAttrs.alt).toBe('');
    expect(thumbnailImageAttrs.draggable).toBe(false);
    expect(thumbnailImageAttrs.class).toBe(thumbnailImageClass);
    expect(thumbnailImageClass).toContain('pointer-events-none');
    expect(thumbnailImageClass).toContain('select-none');
    expect(thumbnailImageClass).toContain('object-cover');
  });
});
