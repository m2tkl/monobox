import { nextTick, ref } from 'vue';

import { sameMemoSnapshot, type MemoSnapshot } from '../../memoSnapshot';

// Owns the comparison between the editable document and confirmed persistence.
export function useMemoDraft(options: {
  initial: MemoSnapshot;
  getCurrentSnapshot: () => MemoSnapshot;
  applyExternalSnapshot: (snapshot: MemoSnapshot) => void;
}) {
  const lastSavedSnapshot = ref<MemoSnapshot>({ ...options.initial });
  const isApplyingExternalSnapshot = ref(false);
  const pendingExternalSnapshot = ref<MemoSnapshot | null>(null);

  const computeDirty = () => !sameMemoSnapshot(options.getCurrentSnapshot(), lastSavedSnapshot.value);
  const recordSavedSnapshot = (snapshot: MemoSnapshot) => {
    lastSavedSnapshot.value = { ...snapshot };
  };

  const receiveExternalSnapshot = (snapshot: MemoSnapshot, isBusy: boolean) => {
    if (sameMemoSnapshot(snapshot, lastSavedSnapshot.value)) return;
    if (isBusy || computeDirty()) {
      pendingExternalSnapshot.value = { ...snapshot };
      return;
    }

    isApplyingExternalSnapshot.value = true;
    try {
      options.applyExternalSnapshot(snapshot);
      recordSavedSnapshot(snapshot);
      pendingExternalSnapshot.value = null;
    }
    finally {
      void nextTick(() => {
        isApplyingExternalSnapshot.value = false;
      });
    }
  };

  return {
    computeDirty,
    isApplyingExternalSnapshot,
    pendingExternalSnapshot,
    recordSavedSnapshot,
    receiveExternalSnapshot,
  };
}
