import { invalidateByEvent } from './query-runtime';
import { loadWorkspaceCollection } from './resources/workspaceCollection';

import type { AppEvent } from './app-event';

import { startOrchestrator, type AnyRule } from '~/resource-state/infra/orchestrator';

const rules: AnyRule<AppEvent>[] = [
  { on: 'app/init', run: () => { loadWorkspaceCollection(); } },
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
      await invalidateByEvent('memo/updated', p);
    },
    debounceMs: 150,
  },
  {
    on: 'memo/deleted',
    run: async ({ workspaceSlug }) => {
      await invalidateByEvent('memo/deleted', { workspaceSlug });
    },
    debounceMs: 150,
  },
  {
    on: 'kanban-assignment/updated',
    run: async (p) => {
      await invalidateByEvent('kanban-assignment/updated', p);
    },
  },
  {
    on: 'bookmark/updated',
    run: p => invalidateByEvent('bookmark/updated', p),
  },
  {
    on: 'kanban-status/updated',
    run: async (p) => {
      await invalidateByEvent('kanban-status/updated', p);
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
