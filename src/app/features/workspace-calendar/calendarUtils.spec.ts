import { describe, expect, it } from 'vitest';

import { buildCalendarMonths, countWorkingDaysBetween, getLocalDateString } from './calendarUtils';

describe('buildCalendarMonths', () => {
  it('builds every day in a leap year', () => {
    const months = buildCalendarMonths(2024);

    expect(months).toHaveLength(12);
    expect(months[1]?.days).toHaveLength(29);
    expect(months.flatMap(month => month.days)).toHaveLength(366);
  });

  it('does not mark weekends as non-working days', () => {
    const saturday = buildCalendarMonths(2026)[0]?.days.find(day => day.date === '2026-01-03');

    expect(saturday?.isWeekend).toBe(true);
  });
});

describe('getLocalDateString', () => {
  it('formats a local date without a time zone conversion', () => {
    expect(getLocalDateString(new Date(2026, 5, 3, 23, 30))).toBe('2026-06-03');
  });
});

describe('countWorkingDaysBetween', () => {
  it('counts target date and excludes configured non-working dates', () => {
    expect(countWorkingDaysBetween(
      '2026-06-03',
      '2026-06-08',
      new Set(['2026-06-06', '2026-06-07']),
    )).toBe(3);
  });

  it('returns a negative value for an overdue milestone', () => {
    expect(countWorkingDaysBetween('2026-06-08', '2026-06-03', new Set())).toBe(-5);
  });
});
