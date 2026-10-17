import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SIDEBAR_ACTION_ORDER,
  parseSidebarActionOrder,
  reorderSidebarActions,
} from './sidebarActionOrder';

describe('sidebar action order', () => {
  it('restores valid saved keys and appends actions introduced later', () => {
    expect(parseSidebarActionOrder('["calendar","focus","unknown","calendar"]'))
      .toEqual(['calendar', 'focus', 'bookmarks', 'kanban', 'files']);
  });

  it('uses the default order for invalid saved data', () => {
    expect(parseSidebarActionOrder('{"focus":true}')).toEqual(DEFAULT_SIDEBAR_ACTION_ORDER);
    expect(parseSidebarActionOrder(null)).toEqual(DEFAULT_SIDEBAR_ACTION_ORDER);
  });

  it('moves an action before or after the drop target', () => {
    expect(reorderSidebarActions(
      DEFAULT_SIDEBAR_ACTION_ORDER,
      'calendar',
      'bookmarks',
      'before',
    )).toEqual(['focus', 'calendar', 'bookmarks', 'kanban', 'files']);

    expect(reorderSidebarActions(
      DEFAULT_SIDEBAR_ACTION_ORDER,
      'focus',
      'files',
      'after',
    )).toEqual(['bookmarks', 'kanban', 'files', 'focus', 'calendar']);
  });
});
