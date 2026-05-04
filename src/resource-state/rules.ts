import { invalidateByEvent } from './query-runtime';
import { loadBookmarkCollection } from './resources/bookmarkCollection';
import { loadKanbans } from './resources/kanbanCollection';
import { loadKanbanStatuses } from './resources/kanbanStatusCollection';
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
        loadBookmarkCollection(workspaceSlug),
        loadWorkspaceMemoLinkCounts(workspaceSlug),
        loadKanbans(workspaceSlug),
      ]);
    },
  },
  { on: 'workspace/created', run: () => { loadWorkspaceCollection(); } },
  { on: 'workspace/deleted', run: () => { loadWorkspaceCollection(); } },
  {
    on: 'memo/created',
    run: async (p) => {
      await invalidateByEvent('memo/created', p);
    },
  },
  {
    on: 'memo/links-updated',
    run: async (p) => {
      await invalidateByEvent('memo/links-updated', p);
    },
    debounceMs: 150,
  },
  {
    on: 'memo/updated',
    run: async (p) => {
      await Promise.all([
        loadWorkspaceMemoLinkCounts(p.workspaceSlug),
        invalidateByEvent('memo/updated', p),
      ]);
    },
    debounceMs: 150,
  },
  {
    on: 'memo/deleted',
    run: async ({ workspaceSlug }) => {
      await Promise.all([
        loadWorkspaceMemoLinkCounts(workspaceSlug),
        invalidateByEvent('memo/deleted', { workspaceSlug }),
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
      await loadKanbanStatuses(p.workspaceSlug, p.kanbanId);
    },
  },
  {
    on: 'kanban/updated',
    run: async (p) => {
      await invalidateByEvent('kanban/updated', p);
    },
  },
];

export function startRules() {
  return startOrchestrator<AppEvent>(rules);
}
