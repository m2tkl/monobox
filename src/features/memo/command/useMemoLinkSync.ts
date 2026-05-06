import { command } from '~/resources/command';
import { emitEvent } from '~/resources/infra/eventBus';
import { AppError } from '~/utils/error';

type SyncMemoLinksTarget = {
  workspaceSlug: string;
  memoSlug: string;
};

export function useMemoLinkSync() {
  const syncMemoLinks = async (
    target: SyncMemoLinksTarget,
    added: string[],
    deleted: string[],
  ): Promise<void> => {
    const isIgnorableLinkSyncError = (error: unknown) => {
      if (!(error instanceof AppError)) {
        return false;
      }

      return error.message.includes('Memo to link not found for slug:')
        || error.message.includes('Memo not found for slug:');
    };

    const results = await Promise.allSettled([
      ...added.map(href => command.link.create({
        workspaceSlug: target.workspaceSlug,
        memoSlug: target.memoSlug,
      }, href)),
      ...deleted.map(href => command.link.delete({
        workspaceSlug: target.workspaceSlug,
        memoSlug: target.memoSlug,
      }, href)),
    ]);

    const fatalErrors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason)
      .filter(error => !isIgnorableLinkSyncError(error));

    if (fatalErrors.length > 0) {
      throw fatalErrors[0];
    }

    emitEvent('memo/links-updated', {
      workspaceSlug: target.workspaceSlug,
      memoSlug: target.memoSlug,
    });
  };

  return {
    syncMemoLinks,
  };
}
