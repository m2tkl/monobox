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
