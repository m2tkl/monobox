import { describe, expect, it } from 'vitest';

import { mergeUniqueMemoItems } from './focusMemoUtils';

describe('mergeUniqueMemoItems', () => {
  it('keeps status items first and removes calendar duplicates', () => {
    const items = mergeUniqueMemoItems(
      [
        { slug_title: 'status-a', source: 'status' },
        { slug_title: 'shared', source: 'status' },
      ],
      [
        { slug_title: 'shared', source: 'calendar' },
        { slug_title: 'calendar-b', source: 'calendar' },
      ],
    );

    expect(items).toEqual([
      { slug_title: 'status-a', source: 'status' },
      { slug_title: 'shared', source: 'status' },
      { slug_title: 'calendar-b', source: 'calendar' },
    ]);
  });
});
