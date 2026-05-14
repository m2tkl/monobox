import type { ActionResult } from './memoEditingAction';

export type UseMemoEditingExportActionsDeps = {
  openExportTargetSelection: () => void;
  finishExportCopying: () => void;
};

export function useMemoEditingExportActions(options: UseMemoEditingExportActionsDeps) {
  const logger = useConsoleLogger('memo-editing/useMemoEditingExportActions');

  const openExportTargetSelection = (): ActionResult => {
    options.openExportTargetSelection();
    return { ok: true, data: undefined };
  };

  const copyExportedResult = async (textToCopy: string): Promise<ActionResult> => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      options.finishExportCopying();
      return { ok: true, data: undefined };
    }
    catch (error) {
      logger.error(error);
      return { ok: false, error };
    }
  };

  return {
    openExportTargetSelection,
    copyExportedResult,
  };
}
