export type CalendarDateRow = {
  date: string;
  month: number;
  monthLabel: string;
  dayOfMonth: number;
  weekday: string;
  isWeekend: boolean;
};

export type CalendarMonth = {
  month: number;
  label: string;
  days: CalendarDateRow[];
};

const formatDate = (year: number, month: number, day: number) =>
  `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

export const buildCalendarMonths = (year: number): CalendarMonth[] => {
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

  return Array.from({ length: 12 }, (_, monthIndex) => {
    const month = monthIndex + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const dayOfMonth = dayIndex + 1;
      const value = new Date(year, monthIndex, dayOfMonth);
      const weekdayIndex = value.getDay();

      return {
        date: formatDate(year, month, dayOfMonth),
        month,
        monthLabel: monthFormatter.format(value).slice(0, 3),
        dayOfMonth,
        weekday: weekdayFormatter.format(value),
        isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
      };
    });

    return {
      month,
      label: monthFormatter.format(new Date(year, monthIndex, 1)),
      days,
    };
  });
};

export const getLocalDateString = (value = new Date()) =>
  formatDate(value.getFullYear(), value.getMonth() + 1, value.getDate());

export const countWorkingDaysBetween = (
  fromDate: string,
  toDate: string,
  nonWorkingDates: ReadonlySet<string>,
): number => {
  if (fromDate === toDate) return 0;

  const direction = fromDate < toDate ? 1 : -1;
  const start = direction > 0 ? fromDate : toDate;
  const end = direction > 0 ? toDate : fromDate;
  let count = 0;

  const cursor = new Date(`${start}T00:00:00`);
  cursor.setDate(cursor.getDate() + 1);
  while (getLocalDateString(cursor) <= end) {
    if (!nonWorkingDates.has(getLocalDateString(cursor))) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count * direction;
};
