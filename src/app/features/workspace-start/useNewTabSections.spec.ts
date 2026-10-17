import { describe, expect, it } from 'vitest';

import { buildNewTabSections } from './useNewTabSections';

const memo = (id: number, title: string) => ({
  id,
  slug_title: title.toLocaleLowerCase(),
  title,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  modified_at: '2026-01-01',
});

describe('new-tab sections', () => {
  it('keeps configured order and sorts status items by position', () => {
    const first = { ...memo(1, 'First'), kanbanStatusId: 8, position: 2 };
    const second = { ...memo(2, 'Second'), kanbanStatusId: 8, position: 1 };
    const sections = buildNewTabSections({
      selectedKeys: ['recent', 'status:8', 'focus'],
      statuses: [{ id: 8, name: 'Inbox', count: 2, orderIndex: 0 }],
      focusItems: [first],
      assignedItems: [first, second],
      recentItems: [second],
    });

    expect(sections.map(section => section.label)).toEqual(['Recent', 'Inbox', 'Focus']);
    expect(sections[1]?.items.map(item => item.title)).toEqual(['Second', 'First']);
  });

  it('drops persisted statuses that no longer exist', () => {
    expect(buildNewTabSections({
      selectedKeys: ['status:99'],
      statuses: [],
      focusItems: [],
      assignedItems: [],
      recentItems: [],
    })).toEqual([]);
  });
});
