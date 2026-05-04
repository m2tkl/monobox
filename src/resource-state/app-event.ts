type EmptyPayload = Record<never, never>;

export type AppEvent = {
  'workspace/created': EmptyPayload;
  'workspace/deleted': EmptyPayload;
  'kanban/updated': { workspaceSlug: string };
  'memo/created': { workspaceSlug: string };
  'memo/links-updated': { workspaceSlug: string; memoSlug: string };
  'memo/updated': { workspaceSlug: string; memoSlug: string };
  'memo/deleted': { workspaceSlug: string };
  'kanban-assignment/updated': { workspaceSlug: string; memoSlug: string };
  'bookmark/updated': { workspaceSlug: string };
  'kanban-status/updated': { workspaceSlug: string; kanbanId: number };
};
