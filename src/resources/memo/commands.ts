import { command as tauriCommand } from '~/external/tauri/command';

export const memoCommand = {
  list: (workspace: { slugName: string }) => tauriCommand.memo.list(workspace),
  create: (memo: { workspaceSlugName: string; title: string }) => tauriCommand.memo.create(memo),
  get: (memo: { workspaceSlugName: string; memoSlugTitle: string }) => tauriCommand.memo.get(memo),
  save: (
    memo: { workspaceSlug: string; memoSlug: string },
    newMemo: {
      slugTitle: string;
      title: string;
      content: string;
      description: string;
      thumbnailImage?: string;
    },
  ) => tauriCommand.memo.save(memo, newMemo),
  search: (params: {
    workspaceSlugName: string;
    query: string;
    limit: number;
    offset: number;
  }) => tauriCommand.memo.search(params),
  trash: (memo: { workspaceSlug: string; memoSlug: string }) => tauriCommand.memo.trash(memo),
} as const;
