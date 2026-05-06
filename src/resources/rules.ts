import { invalidateByEvent } from './query-runtime';

import type { AppEvent } from './events';

import { startOrchestrator, type AnyRule } from '~/resources/infra/orchestrator';

const rules: AnyRule<AppEvent>[] = [
  { on: 'workspace/created', run: payload => invalidateByEvent('workspace/created', payload) },
  { on: 'workspace/deleted', run: payload => invalidateByEvent('workspace/deleted', payload) },
  { on: 'memo/created', run: payload => invalidateByEvent('memo/created', payload) },
  {
    on: 'memo/links-updated',
    run: payload => invalidateByEvent('memo/links-updated', payload),
    debounceMs: 150,
  },
  {
    on: 'memo/updated',
    run: payload => invalidateByEvent('memo/updated', payload),
    debounceMs: 150,
  },
  {
    on: 'memo/deleted',
    run: ({ workspaceSlug }) => invalidateByEvent('memo/deleted', { workspaceSlug }),
    debounceMs: 150,
  },
  { on: 'kanban-assignment/updated', run: payload => invalidateByEvent('kanban-assignment/updated', payload) },
  { on: 'bookmark/updated', run: payload => invalidateByEvent('bookmark/updated', payload) },
  { on: 'kanban-status/updated', run: payload => invalidateByEvent('kanban-status/updated', payload) },
  { on: 'kanban/updated', run: payload => invalidateByEvent('kanban/updated', payload) },
];

export function startRules() {
  return startOrchestrator<AppEvent>(rules);
}
