import type { KanbanAssignmentItem } from '~/models/kanbanAssignment';
import type { KanbanStatus } from '~/models/kanbanStatus';

export type KanbanItem = {
  id: string;
  title: string;
  description?: string;
  memoId: number;
  slug: string;
  statusId: number | null;
  position: number | null;
};

export type KanbanColumnMeta = {
  totalCount: number;
  displayCount: number;
};

export type KanbanColumn = {
  id: string;
  title: string;
  items: KanbanItem[];
  meta?: KanbanColumnMeta;
};

export const STATUS_COLUMN_PREFIX = 'status:';

const sortByPosition = (items: KanbanItem[]) => {
  return [...items].sort((a, b) => {
    const aPos = a.position ?? Number.POSITIVE_INFINITY;
    const bPos = b.position ?? Number.POSITIVE_INFINITY;
    if (aPos !== bPos) return aPos - bPos;
    return b.memoId - a.memoId;
  });
};

export const toKanbanItemFromEntry = (entry: KanbanAssignmentItem): KanbanItem => ({
  id: String(entry.memo_id),
  title: entry.title,
  description: entry.description ?? undefined,
  memoId: entry.memo_id,
  slug: entry.slug_title,
  statusId: entry.kanban_status_id ?? null,
  position: entry.position ?? null,
});

export const buildKanbanColumnsFromEntries = (
  entries: KanbanAssignmentItem[],
  statuses: KanbanStatus[],
): KanbanColumn[] => {
  const statusMap = new Map(statuses.map(status => [status.id, status]));
  const statusBuckets = new Map<number, KanbanItem[]>();
  for (const status of statuses) {
    statusBuckets.set(status.id, []);
  }

  for (const entry of entries) {
    const statusId = entry.kanban_status_id ?? null;
    if (statusId !== null && statusMap.has(statusId)) {
      statusBuckets.get(statusId)?.push(toKanbanItemFromEntry(entry));
    }
  }

  const columns: KanbanColumn[] = [];
  for (const status of statuses) {
    const items = sortByPosition(statusBuckets.get(status.id) ?? []);
    columns.push({
      id: `${STATUS_COLUMN_PREFIX}${status.id}`,
      title: status.name,
      items,
      meta: {
        totalCount: items.length,
        displayCount: items.length,
      },
    });
  }

  return columns;
};

export const toStatusId = (columnId: string): number | null => {
  if (!columnId.startsWith(STATUS_COLUMN_PREFIX)) return null;
  const raw = columnId.slice(STATUS_COLUMN_PREFIX.length);
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getNeighborPositions = (
  items: KanbanItem[],
  draggedId: string,
  beforeItemId?: string,
) => {
  const filtered = items.filter(item => item.id !== draggedId);
  let next: KanbanItem | undefined;
  let prev: KanbanItem | undefined;

  if (beforeItemId) {
    const index = filtered.findIndex(item => item.id === beforeItemId);
    if (index !== -1) {
      next = filtered[index];
      prev = index > 0 ? filtered[index - 1] : undefined;
    }
  }
  else {
    prev = filtered.length > 0 ? filtered[filtered.length - 1] : undefined;
  }

  const prevPos = prev?.position ?? null;
  const nextPos = next?.position ?? null;

  return { prevPos, nextPos };
};

export const computePosition = (
  items: KanbanItem[],
  draggedId: string,
  beforeItemId?: string,
) => {
  const { prevPos, nextPos } = getNeighborPositions(items, draggedId, beforeItemId);

  if (prevPos === null && nextPos === null) {
    const maxPos = items.reduce((max, item) => {
      return item.position !== null ? Math.max(max, item.position) : max;
    }, 0);
    return maxPos + 1000;
  }

  if (prevPos === null && nextPos !== null) {
    return nextPos - 1000;
  }

  if (prevPos !== null && nextPos === null) {
    return prevPos + 1000;
  }

  if (prevPos !== null && nextPos !== null) {
    const gap = nextPos - prevPos;
    if (gap > 1) {
      return prevPos + Math.floor(gap / 2);
    }
    return prevPos + 1;
  }

  return null;
};

export const getNextPositionForStatus = (columns: KanbanColumn[], statusId: number) => {
  const column = columns.find(col => col.id === `${STATUS_COLUMN_PREFIX}${statusId}`);
  if (!column) return 1000;
  const maxPos = column.items.reduce((max, item) => {
    return item.position !== null ? Math.max(max, item.position) : max;
  }, 0);
  return maxPos + 1000;
};
