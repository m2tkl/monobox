import { describe, expect, it } from 'vitest';

import { isImageFile } from './filePreview';

describe('file preview', () => {
  it('previews supported image extensions without treating other files as images', () => {
    expect(isImageFile('Diagram.PNG')).toBe(true);
    expect(isImageFile('photo.jpeg')).toBe(true);
    expect(isImageFile('proposal.pdf')).toBe(false);
    expect(isImageFile('directory')).toBe(false);
  });
});
