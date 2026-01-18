import { describe, expect, it } from 'vitest';

import {
  buildKanbanColumnsFromEntries,
  computePosition,
  getNeighborPositions,
  getNextPositionForStatus,
  STATUS_COLUMN_PREFIX,
  toKanbanItemFromEntry,
  toStatusId,
} from './kanbanUtils';

import type { KanbanAssignmentItem } from '~/models/kanbanAssignment';
import type { KanbanStatus } from '~/models/kanbanStatus';

const makeStatus = (overrides: Partial<KanbanStatus> = {}): KanbanStatus => ({
  id: 1,
  workspace_id: 1,
  kanban_id: 1,
  name: 'ToDo',
  order_index: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const makeEntry = (overrides: Partial<KanbanAssignmentItem> = {}): KanbanAssignmentItem => ({
  memo_id: 1,
  slug_title: 'memo-1',
  title: 'Memo 1',
  description: 'desc',
  kanban_status_id: 1,
  position: 1000,
  modified_at: '2024-01-01T00:00:00Z',
  kanban_id: 1,
  ...overrides,
});

describe('toKanbanItemFromEntry', () => {
  it('maps entry fields to kanban item', () => {
    const entry = makeEntry({ description: null, kanban_status_id: null, position: null });
    expect(toKanbanItemFromEntry(entry)).toEqual({
      id: '1',
      title: 'Memo 1',
      description: undefined,
      memoId: 1,
      slug: 'memo-1',
      statusId: null,
      position: null,
    });
});

describe('buildKanbanColumnsFromEntries', () => {
  it('builds columns from entries and ignores unknown status', () => {
    const statuses = [makeStatus({ id: 1, name: 'Todo' })];
    const entries = [
      makeEntry({ memo_id: 1, kanban_status_id: 1, position: 2000 }),
      makeEntry({ memo_id: 2, kanban_status_id: 2, position: 1000 }),
    ];

    const columns = buildKanbanColumnsFromEntries(entries, statuses);
    expect(columns).toHaveLength(1);
    expect(columns[0].items.map(item => item.memoId)).toEqual([1]);
    expect(columns[0].meta).toEqual({ totalCount: 1, displayCount: 1 });
  });
});

describe('toStatusId', () => {
  it('parses status column ids', () => {
    expect(toStatusId(`${STATUS_COLUMN_PREFIX}10`)).toBe(10);
    expect(toStatusId('unknown:1')).toBeNull();
    expect(toStatusId(`${STATUS_COLUMN_PREFIX}abc`)).toBeNull();
  });
});

describe('getNeighborPositions', () => {
  it('returns neighbor positions for insertion before an item', () => {
    const items = [
      toKanbanItemFromEntry(makeEntry({ memo_id: 1, position: 1000 })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 2, position: 2000 })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 3, position: 3000 })),
    ];

    const { prevPos, nextPos } = getNeighborPositions(items, '1', '3');
    expect(prevPos).toBe(2000);
    expect(nextPos).toBe(3000);
  });

  it('uses last item when inserting at end', () => {
    const items = [
      toKanbanItemFromEntry(makeEntry({ memo_id: 1, position: 1000 })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 2, position: 2000 })),
    ];

    const { prevPos, nextPos } = getNeighborPositions(items, '1');
    expect(prevPos).toBe(2000);
    expect(nextPos).toBeNull();
  });
});

describe('computePosition', () => {
  it('uses max position when all neighbors are null', () => {
    const items = [
      toKanbanItemFromEntry(makeEntry({ memo_id: 1, position: null })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 2, position: null })),
    ];

    expect(computePosition(items, '1')).toBe(1000);
  });

  it('places before next when previous is null', () => {
    const items = [
      toKanbanItemFromEntry(makeEntry({ memo_id: 1, position: 1000 })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 2, position: 2000 })),
    ];

    expect(computePosition(items, '1', '2')).toBe(1000);
  });

  it('places after prev when next is null', () => {
    const items = [
      toKanbanItemFromEntry(makeEntry({ memo_id: 1, position: 1000 })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 2, position: 2000 })),
    ];

    expect(computePosition(items, '1')).toBe(3000);
  });

  it('chooses mid-point when gap is large', () => {
    const items = [
      toKanbanItemFromEntry(makeEntry({ memo_id: 1, position: 1000 })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 2, position: 3000 })),
    ];

    expect(computePosition(items, '1', '2')).toBe(2000);
  });

  it('uses prev + 1 when gap is small', () => {
    const items = [
      toKanbanItemFromEntry(makeEntry({ memo_id: 1, position: 1000 })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 2, position: 1001 })),
      toKanbanItemFromEntry(makeEntry({ memo_id: 3, position: 1002 })),
    ];

    expect(computePosition(items, '3', '2')).toBe(1001);
  });
});

describe('getNextPositionForStatus', () => {
  it('returns max position + 1000 for a status column', () => {
    const statuses = [makeStatus({ id: 1, name: 'Todo' })];
    const entries = [
      makeEntry({ memo_id: 1, kanban_status_id: 1, position: 1000 }),
      makeEntry({ memo_id: 2, kanban_status_id: 1, position: 5000 }),
    ];

    const columns = buildKanbanColumnsFromEntries(entries, statuses);
    expect(getNextPositionForStatus(columns, 1)).toBe(6000);
  });

  it('returns 1000 when status column not found', () => {
    expect(getNextPositionForStatus([], 1)).toBe(1000);
  });
});
