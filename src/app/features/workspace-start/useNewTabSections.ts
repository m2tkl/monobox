import type { NewTabSectionKey } from './newTabPreferences';
import type { GlobalStatusItem } from '~/app/features/memo-browsing/resource/read-model';
import type { MemoIndexItem } from '~/models/memo';

export type NewTabSection = {
  key: NewTabSectionKey;
  label: string;
  items: MemoIndexItem[];
};

export type NewTabSectionOption = {
  key: NewTabSectionKey;
  label: string;
};

export function getNewTabSectionOptions(statuses: GlobalStatusItem[]): NewTabSectionOption[] {
  return [
    { key: 'focus', label: 'Focus' },
    ...statuses.map(status => ({
      key: `status:${status.id}` as const,
      label: status.name,
    })),
    { key: 'recent', label: 'Recent' },
  ];
}

export function buildNewTabSections(input: {
  selectedKeys: NewTabSectionKey[];
  statuses: GlobalStatusItem[];
  focusItems: MemoIndexItem[];
  assignedItems: Array<MemoIndexItem & { kanbanStatusId: number | null; position: number | null }>;
  recentItems: MemoIndexItem[];
}): NewTabSection[] {
  const statusById = new Map(input.statuses.map(status => [status.id, status]));

  return input.selectedKeys.reduce<NewTabSection[]>((sections, key) => {
    if (key === 'focus') {
      sections.push({ key, label: 'Focus', items: input.focusItems });
      return sections;
    }
    if (key === 'recent') {
      sections.push({ key, label: 'Recent', items: input.recentItems });
      return sections;
    }

    const statusId = Number(key.slice('status:'.length));
    const status = statusById.get(statusId);
    if (!status) return sections;

    const items = input.assignedItems
      .filter(item => item.kanbanStatusId === statusId)
      .sort((first, second) => (first.position ?? Number.MAX_SAFE_INTEGER)
        - (second.position ?? Number.MAX_SAFE_INTEGER));
    sections.push({ key, label: status.name, items });
    return sections;
  }, []);
}
