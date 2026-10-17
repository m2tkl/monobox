export type TabShortcutAction = 'next' | 'previous' | 'new' | 'close' | 'restore';

export function getTabShortcutAction(
  event: KeyboardEvent,
  isMac: boolean,
): TabShortcutAction | null {
  if (event.altKey) return null;

  if (event.key === 'Tab' && event.ctrlKey && !event.metaKey) {
    return event.shiftKey ? 'previous' : 'next';
  }

  const hasPrimaryModifier = isMac
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
  if (!hasPrimaryModifier) return null;

  const key = event.key.toLowerCase();
  if (key === 't') return event.shiftKey ? 'restore' : 'new';
  if (key === 'w' && !event.shiftKey) return 'close';
  return null;
}
