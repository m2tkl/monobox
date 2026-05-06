import { command as tauriCommand } from '~/external/tauri/command';

export const linkCommand = {
  list: (memo: { workspaceSlug: string; memoSlug: string }) => tauriCommand.link.list(memo),
  listCounts: (workspaceSlug: string) => tauriCommand.link.listCounts(workspaceSlug),
  create: (
    memo: { workspaceSlug: string; memoSlug: string },
    targetHref: string,
  ) => tauriCommand.link.create(memo, targetHref),
  delete: (
    memo: { workspaceSlug: string; memoSlug: string },
    targetHref: string,
  ) => tauriCommand.link.delete(memo, targetHref),
} as const;
