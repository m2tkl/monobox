import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMemoBrowsing } from './useMemoBrowsing';

const activeMemo = { id: 1, slug_title: 'active', title: 'Active' };
const doneMemo = { id: 2, slug_title: 'done', title: 'Done' };

vi.mock('../../resource/read-model', () => ({
  useWorkspaceMemosReadModel: () => ({
    value: { data: { items: [activeMemo, doneMemo] }, flags: { isLoading: false } },
  }),
  useBookmarkListReadModel: () => ({
    value: { data: { items: [] }, flags: { isLoading: false } },
  }),
  useFocusListReadModel: () => ({
    value: {
      data: {
        items: [activeMemo, doneMemo],
        activeItems: [activeMemo],
        doneTodayMemoSlugs: new Set(['done']),
      },
      flags: { isLoading: false },
    },
  }),
  useGlobalStatusBoardReadModel: () => ({
    value: { data: { statuses: [], assignedItems: [] } },
  }),
}));

describe('useMemoBrowsing Focus view', () => {
  beforeEach(() => {
    vi.stubGlobal('useRoute', () => ({
      path: '/workspace/_focus',
      query: {},
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps items done today visible after active Focus items', () => {
    const browsing = useMemoBrowsing();

    expect(browsing.recentMemos.value.map(memo => memo.slug_title)).toEqual(['active', 'done']);
    expect(browsing.doneTodayMemoSlugs.value).toEqual(new Set(['done']));
    expect(browsing.limitedActiveFocusMemos.value.map(memo => memo.slug_title)).toEqual(['active']);
    expect(browsing.limitedDoneTodayFocusMemos.value.map(memo => memo.slug_title)).toEqual(['done']);
  });
});
