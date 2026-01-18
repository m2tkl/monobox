import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { computed, ref } from 'vue';

import { buildKanbanColumnsFromEntries } from './kanbanUtils';
import { useKanbanOrdering } from './useKanbanOrdering';

import type { KanbanColumn } from './kanbanUtils';
import type { KanbanAssignmentItem } from '~/models/kanbanAssignment';
import type { KanbanStatus } from '~/models/kanbanStatus';

import { command } from '~/external/tauri/command';

vi.mock('~/external/tauri/command', () => ({
  command: {
    kanbanAssignment: {
      upsertStatus: vi.fn(),
    },
  },
}));

const makeStatus = (overrides: Partial<KanbanStatus> = {}): KanbanStatus => ({
  id: 1,
  workspace_id: 1,
  kanban_id: 1,
  name: 'Todo',
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

const setupOrdering = (entriesValue: KanbanAssignmentItem[], statusesValue: KanbanStatus[]) => {
  const workspaceSlug = computed(() => 'ws');
  const kanbanId = computed(() => 1);
  const entries = ref(entriesValue);
  const statuses = computed(() => statusesValue);
  const columns = ref<KanbanColumn[]>([]);
  const buildColumns = vi.fn(() => {
    columns.value = buildKanbanColumnsFromEntries(entries.value, statuses.value);
  });
  const findMemoByItemId = (itemId: string) => {
    const memoId = Number(itemId);
    if (Number.isNaN(memoId)) return null;
    return entries.value.find(entry => entry.memo_id === memoId) ?? null;
  };
  const toast = { add: vi.fn() };

  const ordering = useKanbanOrdering({
    workspaceSlug,
    kanbanId,
    entries,
    statuses,
    columns,
    buildColumns,
    findMemoByItemId,
    toast,
    debug: false,
  });

  buildColumns();

  return {
    ...ordering,
    entries,
    columns,
    buildColumns,
    toast,
  };
};

describe('useKanbanOrdering', () => {
  const upsertStatusMock = vi.mocked(command.kanbanAssignment.upsertStatus);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('seeds missing positions per status and persists updates', async () => {
    const entries = [
      makeEntry({ memo_id: 1, slug_title: 'memo-1', position: null, modified_at: '2024-01-02T00:00:00Z' }),
      makeEntry({ memo_id: 2, slug_title: 'memo-2', position: null, modified_at: '2024-01-01T00:00:00Z' }),
      makeEntry({ memo_id: 3, slug_title: 'memo-3', position: 9000, modified_at: '2024-01-03T00:00:00Z' }),
    ];
    const statuses = [makeStatus({ id: 1 })];
    const ordering = setupOrdering(entries, statuses);

    ordering.buildColumns.mockClear();
    await ordering.seedPositionsIfNeeded();

    expect(entries[0].position).toBe(2000);
    expect(entries[1].position).toBe(3000);
    expect(entries[2].position).toBe(9000);
    expect(upsertStatusMock).toHaveBeenCalledTimes(2);
    expect(upsertStatusMock).toHaveBeenCalledWith({
      workspaceSlugName: 'ws',
      memoSlugTitle: 'memo-1',
      kanbanId: 1,
      kanbanStatusId: 1,
      position: 2000,
    });
    expect(upsertStatusMock).toHaveBeenCalledWith({
      workspaceSlugName: 'ws',
      memoSlugTitle: 'memo-2',
      kanbanId: 1,
      kanbanStatusId: 1,
      position: 3000,
    });
    expect(ordering.buildColumns).toHaveBeenCalledTimes(1);
  });

  it('ignores drag/drop for unassigned memos', async () => {
    const entries = [
      makeEntry({ memo_id: 1, slug_title: 'memo-1', kanban_status_id: null, position: null }),
    ];
    const statuses = [makeStatus({ id: 1 })];
    const ordering = setupOrdering(entries, statuses);

    ordering.buildColumns.mockClear();
    await ordering.handleDrop({
      from: { columnId: 'unassigned', itemId: '1' },
      to: { columnId: 'status:1' },
    });

    expect(entries[0].kanban_status_id).toBeNull();
    expect(upsertStatusMock).not.toHaveBeenCalled();
    expect(ordering.buildColumns).toHaveBeenCalledTimes(1);
  });

  it('updates status and position on drop and persists the change', async () => {
    const entries = [
      makeEntry({ memo_id: 1, slug_title: 'memo-1', kanban_status_id: 1, position: 1000 }),
      makeEntry({ memo_id: 2, slug_title: 'memo-2', kanban_status_id: 2, position: 1000 }),
    ];
    const statuses = [makeStatus({ id: 1 }), makeStatus({ id: 2, name: 'Done' })];
    const ordering = setupOrdering(entries, statuses);

    await ordering.handleDrop({
      from: { columnId: 'status:1', itemId: '1' },
      to: { columnId: 'status:2' },
    });

    expect(entries[0].kanban_status_id).toBe(2);
    expect(entries[0].position).toBe(2000);
    expect(upsertStatusMock).toHaveBeenCalledWith({
      workspaceSlugName: 'ws',
      memoSlugTitle: 'memo-1',
      kanbanId: 1,
      kanbanStatusId: 2,
      position: 2000,
    });
  });

  it('reindexes when neighbor gaps are too small', async () => {
    vi.useFakeTimers();
    const entries = [
      makeEntry({ memo_id: 1, slug_title: 'memo-1', position: 1000, modified_at: '2024-01-01T00:00:00Z' }),
      makeEntry({ memo_id: 2, slug_title: 'memo-2', position: 1001, modified_at: '2024-01-02T00:00:00Z' }),
      makeEntry({ memo_id: 3, slug_title: 'memo-3', position: 3000, modified_at: '2024-01-03T00:00:00Z' }),
    ];
    const statuses = [makeStatus({ id: 1 })];
    const ordering = setupOrdering(entries, statuses);

    await ordering.handleDrop({
      from: { columnId: 'status:1', itemId: '3' },
      to: { columnId: 'status:1', beforeItemId: '2' },
    });

    await vi.runAllTimersAsync();

    expect(entries[0].position).toBe(1000);
    expect(entries[2].position).toBe(2000);
    expect(entries[1].position).toBe(3000);
    expect(upsertStatusMock).toHaveBeenCalledWith({
      workspaceSlugName: 'ws',
      memoSlugTitle: 'memo-3',
      kanbanId: 1,
      kanbanStatusId: 1,
      position: 2000,
    });
    expect(upsertStatusMock).toHaveBeenCalledWith({
      workspaceSlugName: 'ws',
      memoSlugTitle: 'memo-2',
      kanbanId: 1,
      kanbanStatusId: 1,
      position: 3000,
    });
  });

  it('assigns a new status and appends to the end', async () => {
    const entries: KanbanAssignmentItem[] = [];
    const statuses = [makeStatus({ id: 1 })];
    const ordering = setupOrdering(entries, statuses);

    await ordering.assignStatus({
      memoId: 10,
      slug: 'memo-10',
      title: 'Memo 10',
      description: 'desc',
      modifiedAt: '2024-01-10T00:00:00Z',
    }, 1);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      memo_id: 10,
      kanban_status_id: 1,
      position: 1000,
      slug_title: 'memo-10',
    });
    expect(upsertStatusMock).toHaveBeenCalledWith({
      workspaceSlugName: 'ws',
      memoSlugTitle: 'memo-10',
      kanbanId: 1,
      kanbanStatusId: 1,
      position: 1000,
    });
  });
});
