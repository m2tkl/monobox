import { onBeforeUnmount, onMounted, ref } from 'vue';

type UseImeCommitEnterGuardOptions = {
  isActive: () => boolean;
  suppressMs?: number;
  onSuppress?: () => void;
};

export function useImeCommitEnterGuard(options: UseImeCommitEnterGuardOptions) {
  const isComposing = ref(false);
  const lastCompositionEndAt = ref<number | null>(null);
  const suppressMs = options.suppressMs ?? 500;

  function getEventTime(event?: Event) {
    return event?.timeStamp ?? performance.now();
  }

  function isInsideCommitWindow(event?: Event) {
    if (lastCompositionEndAt.value == null) return false;
    return getEventTime(event) - lastCompositionEndAt.value < suppressMs;
  }

  function suppressEvent(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    options.onSuppress?.();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!options.isActive() || event.key !== 'Enter') return;
    // macOS IME can emit the commit Enter shortly after compositionend.
    // Keep suppressing Enter briefly so command palettes do not treat it as selection.
    if (!event.isComposing && !isComposing.value && !isInsideCommitWindow(event)) return;

    suppressEvent(event);
  }

  function handleCompositionStart() {
    if (!options.isActive()) return;
    isComposing.value = true;
  }

  function handleCompositionEnd(event: CompositionEvent) {
    if (!options.isActive()) return;
    isComposing.value = false;
    lastCompositionEndAt.value = event.timeStamp;
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('compositionstart', handleCompositionStart, true);
    window.addEventListener('compositionend', handleCompositionEnd, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('compositionstart', handleCompositionStart, true);
    window.removeEventListener('compositionend', handleCompositionEnd, true);
  });

  return {
    isComposing,
    isInsideCommitWindow,
  };
}
