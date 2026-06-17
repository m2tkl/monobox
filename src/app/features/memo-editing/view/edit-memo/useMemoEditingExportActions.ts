import type { ActionResult } from './memoEditingAction';

export type UseMemoEditingExportActionsDeps = {
  openExportTargetSelection: () => void;
};

export function useMemoEditingExportActions(options: UseMemoEditingExportActionsDeps) {
  const openExportTargetSelection = (): ActionResult => {
    options.openExportTargetSelection();
    return { ok: true, data: undefined };
  };

  return {
    openExportTargetSelection,
  };
}
