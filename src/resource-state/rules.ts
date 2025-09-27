import { loadBookmarkCollection } from './resources/bookmarkCollection';
import { loadMemo } from './resources/memo';
import { loadWorkspaceMemos } from './resources/memoCollection';
import { loadMemoLinkCollection } from './resources/memoLinkCollection';
import { loadWorkspace } from './resources/workspace';
import { loadWorkspaceCollection } from './resources/workspaceCollection';

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
    on: 'memo/updated',
    run: async (p) => {
      await Promise.all([
        loadWorkspaceMemos(p.workspaceSlug),
        loadMemoLinkCollection(p.workspaceSlug, p.memoSlug),
      ]);
    },
    debounceMs: 150,
  },
  {
    on: 'memo/deleted',
    run: ({ workspaceSlug }) => loadWorkspaceMemos(workspaceSlug),
    debounceMs: 150,
  },
  {
    on: 'bookmark/updated',
    run: p => loadBookmarkCollection(p.workspaceSlug),
  },
];

export function startRules() {
  return startOrchestrator<AppEvent>(rules);
}
