import { buildCalendarMonths, countWorkingDaysBetween, getLocalDateString } from '../calendarUtils';
import { loadWorkspaceCalendarData } from '../resource/read/loadWorkspaceCalendarData';
import { useWorkspaceCalendarReadModel } from '../resource/read-model';

import type { CalendarDateRow } from '../calendarUtils';
import type { CalendarDay } from '~/models/calendarDay';
import type { Milestone } from '~/models/milestone';

import { command } from '~/resources/command';
import { handleError } from '~/utils/error';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const emptyDay = (date: string): CalendarDay => ({
  id: 0,
  date,
  note: null,
  is_non_working: false,
  memos: [],
});

export const useWorkspaceCalendarPage = async () => {
  const route = useRoute();
  const toast = useToast();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const currentYear = new Date().getFullYear();
  const selectedYearValue = ref(currentYear);
  const selectedYear = computed(() => selectedYearValue.value);
  const today = getLocalDateString();
  const oneWeekBeforeToday = getLocalDateString(new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() - 7,
  ));
  const months = computed(() => buildCalendarMonths(selectedYear.value));
  const allDateRows = computed<CalendarDateRow[]>(() => months.value.flatMap(month => month.days));
  const readModel = useWorkspaceCalendarReadModel(workspaceSlug, selectedYear);
  const days = computed(() => readModel.value.data.days);
  const memos = computed(() => readModel.value.data.memos);
  const milestones = computed(() => readModel.value.data.milestones);
  const isLoading = computed(() => readModel.value.flags.isLoading);
  const dayMap = computed(() => new Map(days.value.map(day => [day.date, day])));
  const milestoneMap = computed(() => {
    const map = new Map<string, Milestone[]>();
    for (const milestone of milestones.value) {
      const items = map.get(milestone.date) ?? [];
      items.push(milestone);
      map.set(milestone.date, items);
    }
    return map;
  });
  const nonWorkingDates = computed(() => new Set(days.value.filter(day => day.is_non_working).map(day => day.date)));
  const viewMode = ref<'working' | 'settings' | 'milestones'>('working');
  const showEarlierDates = ref(false);

  const getDay = (date: string) => dayMap.value.get(date) ?? emptyDay(date);
  const getMilestones = (date: string) => milestoneMap.value.get(date) ?? [];
  const getMilestoneDaysLabel = (date: string, completed: boolean) => {
    if (completed) return 'Done';
    const daysRemaining = countWorkingDaysBetween(today, date, nonWorkingDates.value);
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining > 0) return `${daysRemaining}d`;
    return `${Math.abs(daysRemaining)}d overdue`;
  };

  const dateRowsFromDefaultStart = computed(() => {
    if (selectedYear.value !== currentYear || showEarlierDates.value) {
      return allDateRows.value;
    }
    return allDateRows.value.filter(day =>
      day.date >= oneWeekBeforeToday
      || getMilestones(day.date).some(milestone => !milestone.completed_at),
    );
  });
  const visibleDays = computed(() => {
    if (viewMode.value === 'settings') {
      return dateRowsFromDefaultStart.value;
    }
    return dateRowsFromDefaultStart.value.filter(day =>
      !getDay(day.date).is_non_working || getMilestones(day.date).length > 0,
    );
  });
  const hiddenEarlierDateCount = computed(() => allDateRows.value.length - dateRowsFromDefaultStart.value.length);
  const canToggleEarlierDates = computed(() =>
    selectedYear.value === currentYear && (showEarlierDates.value || hiddenEarlierDateCount.value > 0),
  );
  const remainingWorkingDays = computed(() =>
    allDateRows.value.filter(day => day.date >= today && !getDay(day.date).is_non_working).length,
  );

  const selectedDate = ref(today);
  const isDialogOpen = ref(false);
  const isSaving = ref(false);
  const selectedDay = computed(() => getDay(selectedDate.value));

  const changeYear = (offset: number) => {
    selectedYearValue.value += offset;
  };

  const goToCurrentYear = () => {
    selectedYearValue.value = currentYear;
  };

  const openDay = (date: string) => {
    selectedDate.value = date;
    isDialogOpen.value = true;
  };

  const updateDay = async (date: string, note: string | null | undefined, isNonWorking: boolean) => {
    try {
      await command.calendarDay.update({
        workspaceSlugName: workspaceSlug.value,
        date,
        note,
        isNonWorking,
      });
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to update calendar day.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const toggleNonWorking = async (date: string, value: boolean | undefined) => {
    const day = getDay(date);
    await updateDay(date, day.note, value === true);
  };

  const saveSelectedDay = async (value: { note: string | null }) => {
    isSaving.value = true;
    try {
      await updateDay(selectedDate.value, value.note, selectedDay.value.is_non_working);
      isDialogOpen.value = false;
    }
    finally {
      isSaving.value = false;
    }
  };

  const addMemo = async (memoSlug: string) => {
    try {
      await command.calendarDay.addMemo({
        workspaceSlugName: workspaceSlug.value,
        date: selectedDate.value,
        memoSlugTitle: memoSlug,
      });
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to link memo.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const removeMemo = async (memoSlug: string) => {
    try {
      await command.calendarDay.removeMemo({
        workspaceSlugName: workspaceSlug.value,
        date: selectedDate.value,
        memoSlugTitle: memoSlug,
      });
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to unlink memo.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  watch(selectedYear, async () => {
    showEarlierDates.value = false;
    await loadWorkspaceCalendarData({ workspaceSlug, year: selectedYear });
  });

  await usePageLoader(() => loadWorkspaceCalendarData({ workspaceSlug, year: selectedYear }));

  return {
    workspaceSlug,
    selectedYear,
    today,
    days,
    memos,
    milestones,
    isLoading,
    nonWorkingDates,
    viewMode,
    showEarlierDates,
    visibleDays,
    hiddenEarlierDateCount,
    canToggleEarlierDates,
    remainingWorkingDays,
    selectedDate,
    isDialogOpen,
    isSaving,
    selectedDay,
    getDay,
    getMilestones,
    getMilestoneDaysLabel,
    changeYear,
    goToCurrentYear,
    openDay,
    toggleNonWorking,
    saveSelectedDay,
    addMemo,
    removeMemo,
  };
};
