import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, nextTick, ref } from 'vue';

import { useMemoCalendarDates } from './useMemoCalendarDates';
import { getLocalDateString } from '../../../workspace-calendar/calendarUtils';

import type { MemoDetail } from '~/models/memo';

import { calendarDayCommand } from '~/resources/calendar-day/commands';

vi.mock('~/resources/calendar-day/commands', () => ({
  calendarDayCommand: {
    listMemoDates: vi.fn(),
    addMemo: vi.fn(),
    removeMemo: vi.fn(),
  },
}));

const scopes: ReturnType<typeof effectScope>[] = [];
function setup() {
  const memo = ref<MemoDetail | null>({
    id: 1, slug_title: 'memo', title: 'Memo', content: '{}', plain_text: '',
    workspace_id: 1, created_at: '', updated_at: '', modified_at: '',
  });
  const toast = { add: vi.fn() };
  const scope = effectScope();
  scopes.push(scope);
  const state = scope.run(() => useMemoCalendarDates({
    workspaceSlug: computed(() => 'workspace'),
    memo: computed(() => memo.value),
    toast: toast as unknown as Parameters<typeof useMemoCalendarDates>[0]['toast'],
  }))!;
  return { ...state, memo, toast };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(calendarDayCommand.listMemoDates).mockResolvedValue([]);
});

afterEach(() => {
  scopes.splice(0).forEach(scope => scope.stop());
  vi.restoreAllMocks();
});

describe('useMemoCalendarDates', () => {
  it('loads dates and prevents duplicate or malformed additions', async () => {
    const state = setup();
    vi.mocked(calendarDayCommand.listMemoDates).mockResolvedValue(['2026-10-18']);
    await state.loadMemoCalendarDates();
    expect(calendarDayCommand.listMemoDates).toHaveBeenCalledWith({
      workspaceSlugName: 'workspace', memoSlugTitle: 'memo',
    });
    for (const date of ['2026-10-18', '', '2026/10/19']) {
      state.memoCalendarDate.value = date;
      expect(state.canAddMemoCalendarDate.value).toBe(false);
      await state.addMemoCalendarDate();
    }
    expect(calendarDayCommand.addMemo).not.toHaveBeenCalled();
    state.memoCalendarDate.value = '2026-10-19';
    expect(state.canAddMemoCalendarDate.value).toBe(true);
  });

  it('adds a date, blocks another addition while pending, and refreshes dates', async () => {
    const state = setup();
    state.memoCalendarDate.value = '2026-10-19';
    let complete!: () => void;
    vi.mocked(calendarDayCommand.addMemo).mockImplementation(() => new Promise<void>((resolve) => {
      complete = resolve;
    }));
    const pending = state.addMemoCalendarDate();
    expect(state.isCalendarDateUpdating.value).toBe(true);
    expect(state.canAddMemoCalendarDate.value).toBe(false);
    await state.addMemoCalendarDate();
    expect(calendarDayCommand.addMemo).toHaveBeenCalledTimes(1);
    expect(calendarDayCommand.addMemo).toHaveBeenCalledWith({
      workspaceSlugName: 'workspace', memoSlugTitle: 'memo', date: '2026-10-19',
    });
    vi.mocked(calendarDayCommand.listMemoDates).mockResolvedValue(['2026-10-19']);
    complete();
    await pending;
    expect(state.currentMemoCalendarDates.value).toEqual(['2026-10-19']);
    expect(state.isCalendarDateUpdating.value).toBe(false);
    expect(state.toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: 'Added memo date.' }));
  });

  it('removes a date and refreshes dates', async () => {
    const state = setup();
    state.currentMemoCalendarDates.value = ['2026-10-18'];
    await state.removeMemoCalendarDate('2026-10-18');
    expect(calendarDayCommand.removeMemo).toHaveBeenCalledWith({
      workspaceSlugName: 'workspace', memoSlugTitle: 'memo', date: '2026-10-18',
    });
    expect(state.currentMemoCalendarDates.value).toEqual([]);
    expect(state.isCalendarDateUpdating.value).toBe(false);
    expect(state.toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: 'Removed memo date.' }));
  });

  it.each(['add', 'remove'] as const)('releases updating state after a failed %s', async (operation) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const state = setup();
    state.memoCalendarDate.value = '2026-10-19';
    vi.mocked(calendarDayCommand[operation === 'add' ? 'addMemo' : 'removeMemo'])
      .mockRejectedValue(new Error('Unavailable'));
    if (operation === 'add') await state.addMemoCalendarDate();
    else await state.removeMemoCalendarDate('2026-10-19');
    expect(state.isCalendarDateUpdating.value).toBe(false);
    expect(state.toast.add).toHaveBeenCalledWith(expect.objectContaining({
      title: `Failed to ${operation} memo date.`, color: 'error',
    }));
  });

  it('preserves loaded dates and notifies on a load failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const state = setup();
    state.currentMemoCalendarDates.value = ['2026-10-18'];
    vi.mocked(calendarDayCommand.listMemoDates).mockRejectedValue(new Error('Unavailable'));
    await state.loadMemoCalendarDates();
    expect(state.currentMemoCalendarDates.value).toEqual(['2026-10-18']);
    expect(state.toast.add).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Failed to load memo dates.', color: 'error',
    }));
  });

  it('resets the date and reloads when the memo changes, and clears dates without a memo', async () => {
    const state = setup();
    state.memoCalendarDate.value = '2000-01-01';
    vi.mocked(calendarDayCommand.listMemoDates).mockResolvedValue(['2026-10-20']);
    state.memo.value = { ...state.memo.value!, slug_title: 'another-memo' };
    await nextTick();
    expect(state.memoCalendarDate.value).toBe(getLocalDateString());
    expect(calendarDayCommand.listMemoDates).toHaveBeenCalledWith({
      workspaceSlugName: 'workspace', memoSlugTitle: 'another-memo',
    });
    expect(state.currentMemoCalendarDates.value).toEqual(['2026-10-20']);
    state.memo.value = null;
    await nextTick();
    expect(state.currentMemoCalendarDates.value).toEqual([]);
    expect(state.canAddMemoCalendarDate.value).toBe(false);
    await state.addMemoCalendarDate();
    await state.removeMemoCalendarDate('2026-10-20');
    expect(calendarDayCommand.addMemo).not.toHaveBeenCalled();
    expect(calendarDayCommand.removeMemo).not.toHaveBeenCalled();
  });
});
