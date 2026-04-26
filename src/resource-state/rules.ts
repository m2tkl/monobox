import { loadBookmarkCollection } from './resources/bookmarkCollection';
import { loadKanbans } from './resources/kanbanCollection';
import { loadKanbanStatuses } from './resources/kanbanStatusCollection';
import { loadMemo } from './resources/memo';
import { loadWorkspaceMemos } from './resources/memoCollection';
import { loadMemoLinkCollection } from './resources/memoLinkCollection';
import { loadWorkspace } from './resources/workspace';
import { loadWorkspaceCollection } from './resources/workspaceCollection';
import { loadWorkspaceMemoLinkCounts } from './resources/workspaceMemoLinkCountCollection';

import type { AppEvent } from './app-event';

import { startOrchestrator, type AnyRule } from '~/resource-state/infra/orchestrator';

const rules: AnyRule<AppEvent>[] = [
  { on: 'app/init', run: () => { loadWorkspaceCollection(); } },
  {
    on: 'workspace/switched',
    run: async ({ workspaceSlug }) => {
      await Promise.all([
        loadWorkspace(workspaceSlug),
        loadWorkspaceMemos(workspaceSlug),
        loadBookmarkCollection(workspaceSlug),
        loadWorkspaceMemoLinkCounts(workspaceSlug),
        loadKanbans(workspaceSlug),
      ]);
    },
  },
  { on: 'workspace/created', run: () => { loadWorkspaceCollection(); } },
  { on: 'workspace/deleted', run: () => { loadWorkspaceCollection(); } },
  { on: 'memo/switched', run: async (p) => {
    await Promise.all([
      loadMemo(p.workspaceSlug, p.memoSlug),
      loadMemoLinkCollection(p.workspaceSlug, p.memoSlug),
    ]);
  } },
  {
    on: 'memo/created',
    run: async (p) => {
      await Promise.all([
        loadWorkspaceMemos(p.workspaceSlug),
        loadWorkspaceMemoLinkCounts(p.workspaceSlug),
      ]);
    },
  },
  {
    on: 'memo/updated',
    run: async (p) => {
      await Promise.all([
        loadWorkspaceMemos(p.workspaceSlug),
        loadWorkspaceMemoLinkCounts(p.workspaceSlug),
        loadMemoLinkCollection(p.workspaceSlug, p.memoSlug),
      ]);
    },
    debounceMs: 150,
  },
  {
    on: 'memo/deleted',
    run: async ({ workspaceSlug }) => {
      await Promise.all([
        loadWorkspaceMemos(workspaceSlug),
        loadWorkspaceMemoLinkCounts(workspaceSlug),
      ]);
    },
    debounceMs: 150,
  },
  {
    on: 'bookmark/updated',
    run: p => loadBookmarkCollection(p.workspaceSlug),
  },
  {
    on: 'kanban-status/updated',
    run: async (p) => {
      await Promise.all([
        loadKanbanStatuses(p.workspaceSlug, p.kanbanId),
        loadWorkspaceMemos(p.workspaceSlug),
      ]);
    },
  },
  {
    on: 'kanban/updated',
    run: async (p) => {
      await loadKanbans(p.workspaceSlug);
    },
  },
];

export function startRules() {
  return startOrchestrator<AppEvent>(rules);
}
