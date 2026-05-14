import { afterEach, describe, expect, it, vi } from 'vitest';

import { publishResourceChanges, registerActiveQuery } from './query-runtime';
import { changeRefs } from '~/resources/changes';
import { resourceRefs } from '~/resources/refs';

describe('query-runtime', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refetches queries for resources affected by the published change kind', async () => {
    const refetchMemoCollection = vi.fn().mockResolvedValue(undefined);
    const refetchMemo = vi.fn().mockResolvedValue(undefined);
    const refetchLinks = vi.fn().mockResolvedValue(undefined);
    const refetchBookmarks = vi.fn().mockResolvedValue(undefined);

    registerActiveQuery({
      resources: [resourceRefs.memoCollection('alpha')],
      refetch: refetchMemoCollection,
    });

    registerActiveQuery({
      resources: [resourceRefs.memo('alpha', 'memo-a')],
      refetch: refetchMemo,
    });

    registerActiveQuery({
      resources: [resourceRefs.linkCollection('alpha', 'memo-a')],
      refetch: refetchLinks,
    });

    registerActiveQuery({
      resources: [resourceRefs.bookmarkCollection('alpha')],
      refetch: refetchBookmarks,
    });

    await publishResourceChanges([
      changeRefs.memoLinksChanged('alpha', 'memo-a'),
    ]);

    expect(refetchMemoCollection).not.toHaveBeenCalled();
    expect(refetchMemo).not.toHaveBeenCalled();
    expect(refetchLinks).toHaveBeenCalledTimes(1);
    expect(refetchBookmarks).not.toHaveBeenCalled();

    await publishResourceChanges([
      changeRefs.memoChanged('alpha', 'memo-a'),
    ]);

    expect(refetchMemoCollection).toHaveBeenCalledTimes(1);
    expect(refetchMemo).toHaveBeenCalledTimes(1);
  });
});
