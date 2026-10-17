export const FIXED_NEW_TAB_SECTION_KEYS = ['focus', 'recent'] as const;

export type NewTabSectionKey = 'focus' | 'recent' | `status:${number}`;

function isSectionKey(value: unknown): value is NewTabSectionKey {
  return value === 'focus'
    || value === 'recent'
    || (typeof value === 'string' && /^status:\d+$/.test(value));
}

export function getDefaultNewTabSectionKeys(
  statuses: Array<{ id: number; name: string }>,
): NewTabSectionKey[] {
  const preferredNames = ['inbox', 'waiting'];
  const preferredStatuses = preferredNames
    .map(name => statuses.find(status => status.name.toLocaleLowerCase().includes(name)))
    .filter((status): status is { id: number; name: string } => !!status);

  return [
    'focus',
    ...preferredStatuses.map(status => `status:${status.id}` as const),
    'recent',
  ];
}

export function parseNewTabSectionKeys(value: string | null): NewTabSectionKey[] | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const keys = [...new Set(parsed.filter(isSectionKey))];
    return keys.length > 0 ? keys : null;
  }
  catch {
    return null;
  }
}

export function newTabPreferencesKey(workspaceSlug: string) {
  return `monobox:new-tab-sections:${workspaceSlug}`;
}
