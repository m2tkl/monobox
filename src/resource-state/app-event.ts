export type AppEvent = {
  'app/init': undefined;
  'workspace/switched': { workspaceSlug: string };
  'workspace/created': undefined;
  'workspace/deleted': undefined;
  'memo/switched': { workspaceSlug: string; memoSlug: string };
  'memo/created': { workspaceSlug: string };
  'memo/updated': { workspaceSlug: string; memoSlug: string };
  'memo/deleted': { workspaceSlug: string };
  'bookmark/updated': { workspaceSlug: string };
};
