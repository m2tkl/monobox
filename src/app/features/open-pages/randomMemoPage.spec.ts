import { describe, expect, it } from 'vitest';

import { pickRandomMemoPage } from './randomMemoPage';

import type { MemoIndexItem } from '~/models/memo';

const memo = (slug: string): MemoIndexItem => ({
  id: 1,
  slug_title: slug,
  title: `Title ${slug}`,
  created_at: '',
  updated_at: '',
  modified_at: '',
});

describe('pickRandomMemoPage', () => {
  it('returns no page when there are no memos', () => {
    expect(pickRandomMemoPage([], () => 0)).toBeNull();
  });

  it('returns a memo page for the chosen item', () => {
    expect(pickRandomMemoPage([memo('first'), memo('second')], () => 0.75))
      .toEqual({ memoSlug: 'second', title: 'Title second' });
  });
});
