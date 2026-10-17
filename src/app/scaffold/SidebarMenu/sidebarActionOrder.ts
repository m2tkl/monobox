export const DEFAULT_SIDEBAR_ACTION_ORDER = [
  'focus',
  'bookmarks',
  'kanban',
  'files',
  'calendar',
] as const;

export type SidebarActionKey = typeof DEFAULT_SIDEBAR_ACTION_ORDER[number];

const sidebarActionKeys = new Set<string>(DEFAULT_SIDEBAR_ACTION_ORDER);

export const SIDEBAR_ACTION_ORDER_STORAGE_KEY = 'monobox:sidebar-action-order';

export function parseSidebarActionOrder(value: string | null): SidebarActionKey[] {
  if (!value) return [...DEFAULT_SIDEBAR_ACTION_ORDER];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [...DEFAULT_SIDEBAR_ACTION_ORDER];

    const savedKeys = [...new Set(parsed.filter(
      (key): key is SidebarActionKey => typeof key === 'string' && sidebarActionKeys.has(key),
    ))];
    const missingKeys = DEFAULT_SIDEBAR_ACTION_ORDER.filter(key => !savedKeys.includes(key));
    return [...savedKeys, ...missingKeys];
  }
  catch {
    return [...DEFAULT_SIDEBAR_ACTION_ORDER];
  }
}

export function reorderSidebarActions(
  order: readonly SidebarActionKey[],
  draggedKey: SidebarActionKey,
  targetKey: SidebarActionKey,
  position: 'before' | 'after',
): SidebarActionKey[] {
  if (draggedKey === targetKey) return [...order];
  if (!order.includes(draggedKey) || !order.includes(targetKey)) return [...order];

  const reordered = order.filter(key => key !== draggedKey);
  const targetIndex = reordered.indexOf(targetKey);
  reordered.splice(position === 'before' ? targetIndex : targetIndex + 1, 0, draggedKey);
  return reordered;
}
