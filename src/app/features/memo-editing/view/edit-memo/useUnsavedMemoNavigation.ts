import { onScopeDispose, ref, watch } from 'vue';

import type { MemoState } from './memoMachine';
import type { Ref } from 'vue';

type Choice = 'save' | 'discard' | 'cancel';

export function useUnsavedMemoNavigation(options: {
  state: Readonly<Ref<MemoState>>;
  save: () => Promise<void>;
}) {
  const isUnsavedNavigationDialogOpen = ref(false);
  const isSavingBeforeNavigation = ref(false);
  let pendingChoice: ((choice: Choice) => void) | null = null;
  let disposed = false;
  const isBusy = () => options.state.value.type === 'saving' || options.state.value.type === 'deleting';
  const isDirty = () => options.state.value.type === 'dirty';

  const resolveUnsavedNavigationChoice = (choice: Choice) => {
    const resolve = pendingChoice;
    pendingChoice = null;
    resolve?.(choice);
    if (choice !== 'save') isUnsavedNavigationDialogOpen.value = false;
  };

  const handleUnsavedNavigationDialogOpen = (open: boolean) => {
    if (isSavingBeforeNavigation.value) return;
    if (open) isUnsavedNavigationDialogOpen.value = true;
    else resolveUnsavedNavigationChoice('cancel');
  };

  const confirmUnsavedNavigation = async (to: { path: string }, from: { path: string }) => {
    if (to.path === from.path || options.state.value.type === 'deleted') return true;
    // A running write must finish before leaving or discarding its document.
    if (isBusy() || isSavingBeforeNavigation.value) return false;
    if (!isDirty()) return true;

    // Supersede an earlier navigation without leaving its guard unresolved.
    pendingChoice?.('cancel');
    const choice = await new Promise<Choice>((resolve) => {
      pendingChoice = resolve;
      isUnsavedNavigationDialogOpen.value = true;
    });
    if (disposed || choice === 'cancel') return false;
    if (choice === 'discard') return !isBusy();

    isSavingBeforeNavigation.value = true;
    try {
      await options.save();
      return !disposed && !isBusy() && !isDirty();
    }
    catch {
      return false;
    }
    finally {
      isSavingBeforeNavigation.value = false;
      isUnsavedNavigationDialogOpen.value = false;
    }
  };

  watch(() => options.state.value.type, (type) => {
    if (type === 'deleted') resolveUnsavedNavigationChoice('discard');
  }, { flush: 'sync' });

  onScopeDispose(() => {
    disposed = true;
    resolveUnsavedNavigationChoice('cancel');
  });

  return {
    isUnsavedNavigationDialogOpen,
    isSavingBeforeNavigation,
    resolveUnsavedNavigationChoice,
    handleUnsavedNavigationDialogOpen,
    confirmUnsavedNavigation,
  };
}
