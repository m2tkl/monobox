import { describe, expect, it } from 'vitest';

import { buildFocusList } from './focusList';

describe('Focus selection', () => {
  const status = [{ slug_title: 'a', orderIndex: 0 }, { slug_title: 'b', orderIndex: 1 }];
  const calendar = [{ slug_title: 'b', orderIndex: 0 }, { slug_title: 'c', orderIndex: 1 }];

  it('keeps status order and precedence, then appends distinct calendar memos', () => {
    const result = buildFocusList(status, calendar, [], '2026-12-31');
    expect(result.items).toEqual([...status, { slug_title: 'c', orderIndex: 3 }]);
    expect(result.activeItems).toEqual(result.items);
  });

  it('excludes only completions for the target day without changing membership', () => {
    const done = [{ slug_title: 'a', doneOn: '2026-12-31' }, { slug_title: 'b', doneOn: '2026-12-30' }];
    const result = buildFocusList(status, calendar, done, '2026-12-31');
    expect(result.items.map(item => item.slug_title)).toEqual(['a', 'b', 'c']);
    expect(result.activeItems.map(item => item.slug_title)).toEqual(['b', 'c']);
    expect(buildFocusList(status, calendar, done, '2027-01-01').activeItems).toEqual(result.items);
  });

  it('keeps calendar membership after status removal and does not restore nonmembers on undo', () => {
    expect(buildFocusList([], calendar, [], '2026-12-31').activeItems).toEqual(calendar);
    expect(buildFocusList([], [], [], '2026-12-31').activeItems).toEqual([]);
  });
});
