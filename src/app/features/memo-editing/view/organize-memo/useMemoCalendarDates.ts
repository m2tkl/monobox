import { computed, ref, watch } from 'vue';

import { getLocalDateString } from '../../../workspace-calendar/calendarUtils';

import type { useToast } from '#imports';
import type { ComputedRef } from 'vue';
import type { MemoDetail } from '~/models/memo';

import { calendarDayCommand } from '~/resources/calendar-day/commands';
import { iconKey } from '~/utils/icon';

type UseMemoCalendarDatesOptions = {
  workspaceSlug: ComputedRef<string>;
  memo: ComputedRef<MemoDetail | null>;
  toast: ReturnType<typeof useToast>;
};

export function useMemoCalendarDates(options: UseMemoCalendarDatesOptions) {
  const memoCalendarDate = ref(getLocalDateString());
  const isCalendarDateUpdating = ref(false);
  const currentMemoCalendarDates = ref<string[]>([]);
  const loadMemoCalendarDates = async () => {
    const memo = options.memo.value;
    if (!memo) {
      currentMemoCalendarDates.value = [];
      return;
    }

    try {
      currentMemoCalendarDates.value = await calendarDayCommand.listMemoDates({
        workspaceSlugName: options.workspaceSlug.value,
        memoSlugTitle: memo.slug_title,
      });
    }
    catch (error) {
      console.error(error);
      options.toast.add({
        title: 'Failed to load memo dates.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
  };
  const canAddMemoCalendarDate = computed(() =>
    !!options.memo.value
    && /^\d{4}-\d{2}-\d{2}$/.test(String(memoCalendarDate.value))
    && !currentMemoCalendarDates.value.includes(String(memoCalendarDate.value))
    && !isCalendarDateUpdating.value,
  );

  const addMemoCalendarDate = async () => {
    const memo = options.memo.value;
    if (!memo || !canAddMemoCalendarDate.value) return;

    try {
      isCalendarDateUpdating.value = true;
      await calendarDayCommand.addMemo({
        workspaceSlugName: options.workspaceSlug.value,
        date: String(memoCalendarDate.value),
        memoSlugTitle: memo.slug_title,
      });
      await loadMemoCalendarDates();
      options.toast.add({
        title: 'Added memo date.',
        duration: 1200,
        icon: iconKey.success,
      });
    }
    catch (error) {
      console.error(error);
      options.toast.add({
        title: 'Failed to add memo date.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isCalendarDateUpdating.value = false;
    }
  };

  const removeMemoCalendarDate = async (date: string) => {
    const memo = options.memo.value;
    if (!memo) return;

    try {
      isCalendarDateUpdating.value = true;
      await calendarDayCommand.removeMemo({
        workspaceSlugName: options.workspaceSlug.value,
        date,
        memoSlugTitle: memo.slug_title,
      });
      await loadMemoCalendarDates();
      options.toast.add({
        title: 'Removed memo date.',
        duration: 1200,
        icon: iconKey.success,
      });
    }
    catch (error) {
      console.error(error);
      options.toast.add({
        title: 'Failed to remove memo date.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isCalendarDateUpdating.value = false;
    }
  };

  watch(() => options.memo.value?.slug_title ?? null, () => {
    memoCalendarDate.value = getLocalDateString();
    void loadMemoCalendarDates();
  });

  return {
    memoCalendarDate,
    isCalendarDateUpdating,
    currentMemoCalendarDates,
    canAddMemoCalendarDate,
    loadMemoCalendarDates,
    addMemoCalendarDate,
    removeMemoCalendarDate,
  };
}
