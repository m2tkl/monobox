type EmptyPayload = Record<never, never>;

export type AppEvent = {
  'app/init': EmptyPayload;
  'workspace/switched': { workspaceSlug: string };
  'workspace/created': EmptyPayload;
  'workspace/deleted': EmptyPayload;
  'kanban/updated': { workspaceSlug: string };
  'memo/created': { workspaceSlug: string };
  'memo/updated': { workspaceSlug: string; memoSlug: string };
  'memo/deleted': { workspaceSlug: string };
  'bookmark/updated': { workspaceSlug: string };
  'kanban-status/updated': { workspaceSlug: string; kanbanId: number };
};
