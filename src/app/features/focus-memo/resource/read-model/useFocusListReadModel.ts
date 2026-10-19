import { computed } from 'vue';

import { buildFocusList } from './focusList';
import { useFocusDailyStateReadModel } from './useFocusDailyStateReadModel';
import { useTodayCalendarMemoListReadModel } from './useTodayCalendarMemoListReadModel';

import type { MemoIndexItem } from '~/models/memo';

import { useGlobalStatusBoardReadModel } from '~/app/features/memo-browsing/resource/read-model/useGlobalStatusBoardReadModel';
import { useLocalDate } from '~/app/features/workspace-calendar/useLocalDate';

export type FocusListItem = MemoIndexItem & {
  linkCount: number;
  orderIndex: number;
};

export type FocusListReadModel = {
  data: {
    items: FocusListItem[];
    activeItems: FocusListItem[];
    doneTodayMemoSlugs: ReadonlySet<string>;
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useFocusListReadModel() {
  const today = useLocalDate();
  const globalStatusVM = useGlobalStatusBoardReadModel();
  const focusDailyStateVM = useFocusDailyStateReadModel(today);
  const todayCalendarMemoVM = useTodayCalendarMemoListReadModel(today);

  const list = computed(() => buildFocusList(
    globalStatusVM.value.data.nowItems,
    todayCalendarMemoVM.value.data.items,
    focusDailyStateVM.value.data.items,
    today.value,
  ));

  return computed<FocusListReadModel>(() => ({
    data: {
      items: list.value.items,
      activeItems: list.value.activeItems,
      doneTodayMemoSlugs: list.value.doneTodayMemoSlugs,
    },
    flags: {
      isLoading: globalStatusVM.value.flags.isLoading
        || focusDailyStateVM.value.flags.isLoading
        || todayCalendarMemoVM.value.flags.isLoading,
      isStale: globalStatusVM.value.flags.isStale
        || focusDailyStateVM.value.flags.isStale
        || todayCalendarMemoVM.value.flags.isStale,
      hasError: globalStatusVM.value.flags.hasError
        || focusDailyStateVM.value.flags.hasError
        || todayCalendarMemoVM.value.flags.hasError,
    },
  }));
}
