import type { ActionResult } from './memoEditingAction';

export type UseMemoEditingUiActionsDeps = {
  openKanbanModal: () => void;
  openExportTargetSelection: () => void;
};

export function useMemoEditingUiActions(options: UseMemoEditingUiActionsDeps) {
  const openKanbanModal = (): ActionResult => {
    options.openKanbanModal();
    return { ok: true, data: undefined };
  };

  const openExportTargetSelection = (): ActionResult => {
    options.openExportTargetSelection();
    return { ok: true, data: undefined };
  };

  return {
    openKanbanModal,
    openExportTargetSelection,
  };
}
