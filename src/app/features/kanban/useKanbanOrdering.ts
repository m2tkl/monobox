// Handles Kanban ordering for memo cards: computes positions on drag/assign,
// persists changes to the backend, seeds missing positions, and schedules
// reindexing when gaps are too small or positions are missing. Unassigned
// memos (kanban_status_id: null) are treated as non-draggable.
//
// Rules:
// - Positions use 1000-based spacing to allow in-between inserts.
// - Drag/drop computes a new position based on neighbors in the destination.
// - If neighbor gap is too small or any null positions exist, reindex the column.
// - Reindex rewrites positions to (index + 1) * 1000 in sorted order.
// - Seed assigns positions for null entries per status, newest first.
// - Assigning a status appends to the end using max position + 1000.
// - UI updates optimistically; failures revert local state and show a toast.
import { ref } from 'vue';

import {
  computePosition,
  getNeighborPositions,
  getNextPositionForStatus,
  toStatusId,
  type KanbanColumn,
} from './kanbanUtils';

import type { ComputedRef, Ref } from 'vue';
import type { KanbanAssignmentItem } from '~/models/kanbanAssignment';
import type { KanbanStatus } from '~/models/kanbanStatus';

import { command } from '~/external/tauri/command';
import { iconKey } from '~/utils/icon';

type UseKanbanOrderingOptions = {
  workspaceSlug: ComputedRef<string>;
  kanbanId: ComputedRef<number | null>;
  entries: Ref<KanbanAssignmentItem[]>;
  statuses: ComputedRef<KanbanStatus[]>;
  columns: Ref<KanbanColumn[]>;
  buildColumns: () => void;
  findMemoByItemId: (itemId: string) => KanbanAssignmentItem | null;
  toast: ReturnType<typeof useToast>;
  debug?: boolean;
};

export function useKanbanOrdering(options: UseKanbanOrderingOptions) {
  const logInfo = (...args: unknown[]) => {
    if (options.debug) {
      console.info(...args);
    }
  };
  const isAssigning = ref(false);
  const isSeedingPositions = ref(false);
  const reindexTimers = new Map<string, number>();

  const persistStatusUpdate = async (
    memoSlugTitle: string,
    statusId: number | null,
    position: number | null,
  ) => {
    if (!options.workspaceSlug.value) return;
    if (options.kanbanId.value == null) return;
    await command.kanbanAssignment.upsertStatus({
      workspaceSlugName: options.workspaceSlug.value,
      memoSlugTitle,
      kanbanId: options.kanbanId.value,
      kanbanStatusId: statusId,
      position,
    });
  };

  const persistPositions = async (updates: { entry: KanbanAssignmentItem; position: number }[]) => {
    if (options.kanbanId.value == null) return;
    await Promise.all(updates.map((update) => {
      return persistStatusUpdate(
        update.entry.slug_title,
        update.entry.kanban_status_id ?? null,
        update.position,
      );
    }));
  };

  const seedPositionsIfNeeded = async () => {
    if (!options.workspaceSlug.value) return;
    if (options.kanbanId.value == null) return;
    if (isSeedingPositions.value) return;
    if (options.statuses.value.length === 0) return;

    const updates: { entry: KanbanAssignmentItem; position: number }[] = [];

    for (const status of options.statuses.value) {
      const items = options.entries.value.filter(entry => entry.kanban_status_id === status.id);
      const missing = items.filter(item => item.position == null);
      if (missing.length === 0) continue;

      const sorted = [...items].sort((a, b) => b.modified_at.localeCompare(a.modified_at));
      sorted.forEach((entry, index) => {
        const position = (index + 1) * 1000;
        if (entry.position == null) {
          updates.push({ entry, position });
        }
      });
    }

    if (updates.length === 0) return;

    isSeedingPositions.value = true;
    try {
      await persistPositions(updates);

      for (const update of updates) {
        update.entry.position = update.position;
      }
      options.buildColumns();
    }
    catch (error) {
      console.error(error);
    }
    finally {
      isSeedingPositions.value = false;
    }
  };

  const scheduleReindex = (statusId: number) => {
    if (!options.workspaceSlug.value) return;
    const key = String(statusId);
    const existing = reindexTimers.get(key);
    if (existing) {
      window.clearTimeout(existing);
    }

    const timer = window.setTimeout(async () => {
      const reindexStartedAt = performance.now();
      reindexTimers.delete(key);
      if (options.kanbanId.value == null) return;
      const items = options.entries.value.filter(entry => entry.kanban_status_id === statusId);
      if (items.length === 0) return;

      const sorted = [...items].sort((a, b) => {
        const aPos = a.position ?? Number.POSITIVE_INFINITY;
        const bPos = b.position ?? Number.POSITIVE_INFINITY;
        if (aPos !== bPos) return aPos - bPos;
        return b.modified_at.localeCompare(a.modified_at);
      });

      const updates = sorted.map((entry, index) => ({
        entry,
        position: (index + 1) * 1000,
      })).filter((update) => {
        return update.entry.position !== update.position;
      });

      if (updates.length === 0) return;

      try {
        await persistPositions(updates);
        const reindexFinishedAt = performance.now();
        logInfo('[Kanban] reindex:db-updated', {
          statusId,
          elapsedMs: Math.round(reindexFinishedAt - reindexStartedAt),
          count: updates.length,
        });

        for (const update of updates) {
          update.entry.position = update.position;
        }
        options.buildColumns();
      }
      catch (error) {
        console.error(error);
      }
    }, 250);

    reindexTimers.set(key, timer);
  };

  const handleDrop = async (payload: {
    from: { columnId: string; itemId: string };
    to: { columnId: string; beforeItemId?: string };
  }) => {
    const dropStartedAt = performance.now();
    const memo = options.findMemoByItemId(payload.from.itemId);
    if (!memo || !options.workspaceSlug.value) return;
    if (options.kanbanId.value == null) return;

    const nextStatusId = toStatusId(payload.to.columnId);
    const currentStatusId = memo.kanban_status_id ?? null;

    if (currentStatusId === null || nextStatusId === null) {
      // Unassigned memos are not draggable between columns.
      options.buildColumns();
      return;
    }

    const destinationColumn = options.columns.value.find(column => column.id === payload.to.columnId);
    const nextPosition = destinationColumn
      ? computePosition(destinationColumn.items, payload.from.itemId, payload.to.beforeItemId)
      : null;

    if (nextStatusId === currentStatusId && nextPosition === memo.position) {
      return;
    }

    const needsReindex = (() => {
      if (!destinationColumn) return false;
      if (destinationColumn.items.some(item => item.position === null)) {
        return true;
      }
      const { prevPos, nextPos } = getNeighborPositions(
        destinationColumn.items,
        payload.from.itemId,
        payload.to.beforeItemId,
      );
      if (prevPos !== null && nextPos !== null && nextPos - prevPos <= 1) {
        return true;
      }
      return false;
    })();

    const target = options.entries.value.find(item => item.memo_id === memo.memo_id);
    const previousState = target
      ? {
          kanban_status_id: target.kanban_status_id ?? null,
          position: target.position ?? null,
        }
      : null;

    if (target) {
      target.kanban_status_id = nextStatusId;
      target.position = nextPosition ?? null;
    }

    const uiUpdatedAt = performance.now();
    logInfo('[Kanban] drop:ui-updated', {
      elapsedMs: Math.round(uiUpdatedAt - dropStartedAt),
      from: payload.from.columnId,
      to: payload.to.columnId,
      beforeItemId: payload.to.beforeItemId ?? null,
    });

    const persistMove = async () => {
      const dbStartedAt = performance.now();
      try {
        await persistStatusUpdate(memo.slug_title, nextStatusId, nextPosition);
        const dbFinishedAt = performance.now();
        logInfo('[Kanban] drop:db-updated', {
          elapsedMs: Math.round(dbFinishedAt - dbStartedAt),
        });
        if (needsReindex && nextStatusId !== null) {
          const reindexStartedAt = performance.now();
          scheduleReindex(nextStatusId);
          const reindexFinishedAt = performance.now();
          logInfo('[Kanban] drop:reindex-scheduled', {
            elapsedMs: Math.round(reindexFinishedAt - reindexStartedAt),
          });
        }
      }
      catch (error) {
        console.error(error);
        if (target && previousState) {
          target.kanban_status_id = previousState.kanban_status_id;
          target.position = previousState.position;
        }
        options.buildColumns();
        options.toast.add({
          title: 'Failed to update status.',
          description: 'Please try again.',
          color: 'error',
          icon: iconKey.failed,
        });
      }
    };

    requestAnimationFrame(() => {
      void persistMove();
    });
  };

  const assignStatus = async (
    item: { memoId: number; slug: string; title: string; description?: string; modifiedAt: string },
    statusId: number,
  ) => {
    if (!options.workspaceSlug.value) return;
    if (options.kanbanId.value == null) return;
    if (isAssigning.value) return;

    isAssigning.value = true;
    const nextPosition = getNextPositionForStatus(options.columns.value, statusId);
    const existing = options.entries.value.find(entry => entry.memo_id === item.memoId);
    const previousState = existing
      ? { kanban_status_id: existing.kanban_status_id ?? null, position: existing.position ?? null }
      : null;

    try {
      if (existing) {
        existing.kanban_status_id = statusId;
        existing.position = nextPosition;
      }

      await persistStatusUpdate(item.slug, statusId, nextPosition);

      if (!existing) {
        options.entries.value.push({
          memo_id: item.memoId,
          slug_title: item.slug,
          title: item.title,
          description: item.description,
          kanban_status_id: statusId,
          position: nextPosition,
          modified_at: item.modifiedAt,
          kanban_id: options.kanbanId.value,
        });
      }
      options.buildColumns();
    }
    catch (error) {
      console.error(error);
      if (existing && previousState) {
        existing.kanban_status_id = previousState.kanban_status_id;
        existing.position = previousState.position;
      }
      options.buildColumns();
      options.toast.add({
        title: 'Failed to update status.',
        description: 'Please try again.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isAssigning.value = false;
    }
  };

  return {
    isAssigning,
    isSeedingPositions,
    seedPositionsIfNeeded,
    handleDrop,
    assignStatus,
  };
}
