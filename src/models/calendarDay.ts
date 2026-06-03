export type CalendarDayMemo = {
  id: number;
  slug_title: string;
  title: string;
};

export type CalendarDay = {
  id: number;
  date: string;
  note?: string | null;
  is_non_working: boolean;
  memos: CalendarDayMemo[];
};
