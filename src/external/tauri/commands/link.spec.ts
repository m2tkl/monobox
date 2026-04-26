import { describe, expect, it } from 'vitest';

import { normalizeSlugSegment } from './link';

describe('external/tauri/commands/link', () => {
  it('normalizes raw title-like path segments into memo slugs', () => {
    expect(normalizeSlugSegment('ProjectNotes')).toBe('ProjectNotes');
    expect(normalizeSlugSegment('Project Notes')).toBe('Project_Notes');
  });

  it('normalizes percent-encoded path segments into memo slugs', () => {
    expect(normalizeSlugSegment('Project%20Notes'))
      .toBe('Project_Notes');
  });
});
