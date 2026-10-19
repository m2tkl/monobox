import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, reactive, ref, toValue } from 'vue';

import { useTodayCalendarMemoListReadModel } from './useTodayCalendarMemoListReadModel';

import type { ResourceSnapshot } from '~/resource-runtime/infra/types';

const { route, snapshots, calendarArgs } = vi.hoisted(() => ({
  route: { params: { workspace: 'workspace' } },
  snapshots: {} as Record<string, ResourceSnapshot<unknown>>,
  calendarArgs: { current: null as null | { year: unknown } },
}));

beforeEach(() => vi.stubGlobal('useRoute', () => reactive(route)));
vi.mock('~/resources/calendar-day/queries', () => ({ workspaceCalendarDaysQuery: 'calendar' }));
vi.mock('~/resources/memo/queries', () => ({ workspaceMemosQuery: 'memos' }));
vi.mock('~/resources/memo-link/queries', () => ({ workspaceMemoLinkCountsQuery: 'links' }));
vi.mock('~/resource-runtime/useQuery', () => ({
  useQuery: (query: string, args: { workspaceSlug: unknown; year?: unknown }) => {
    if (query === 'calendar') calendarArgs.current = args as { year: unknown };
    return {
      snapshot: computed(() => {
        const key = [query, toValue(args.workspaceSlug), args.year ? toValue(args.year) : ''].join('/');
        return reactive(snapshots)[key] ?? {
          current: null, status: 'loading', updatedAt: null, loadingSince: 0,
        };
      }),
    };
  },
}));

const scopes: ReturnType<typeof effectScope>[] = [];
afterEach(() => {
  vi.unstubAllGlobals();
  scopes.splice(0).forEach(scope => scope.stop());
  Object.keys(snapshots).forEach(key => Reflect.deleteProperty(snapshots, key));
  route.params.workspace = 'workspace';
});

const put = (key: string, current: unknown, status: ResourceSnapshot<unknown>['status'] = 'success') => {
  reactive(snapshots)[key] = { current, status, updatedAt: 1, loadingSince: null };
};

describe('today calendar read model', () => {
  it('changes the calendar query year and selected day together', () => {
    const today = ref('2026-12-31');
    put('memos/workspace/', [{ id: 1, slug_title: 'first' }, { id: 2, slug_title: 'second' }]);
    put('links/workspace/', []);
    put('calendar/workspace/2026', [{ date: '2026-12-31', memos: [{ id: 1 }] }]);
    put('calendar/workspace/2027', [{ date: '2027-01-01', memos: [{ id: 2 }] }]);
    const scope = effectScope();
    scopes.push(scope);
    const model = scope.run(() => useTodayCalendarMemoListReadModel(today))!;
    expect(model.value.data.items.map(item => item.slug_title)).toEqual(['first']);
    today.value = '2027-01-01';
    expect(toValue(calendarArgs.current!.year)).toBe(2027);
    expect(model.value.data.items.map(item => item.slug_title)).toEqual(['second']);
    reactive(route).params.workspace = 'other';
    expect(model.value.data.items).toEqual([]);
    expect(model.value.flags.isLoading).toBe(true);
  });

  it('retains available items and exposes a failed refresh as stale', () => {
    const today = ref('2026-12-31');
    put('memos/workspace/', [{ id: 1, slug_title: 'first' }]);
    put('links/workspace/', [{ memo_id: 1, direct_link_count: 2, backlink_count: 3 }]);
    const days = [{ date: '2026-12-31', memos: [{ id: 1 }] }];
    put('calendar/workspace/2026', days);
    const scope = effectScope();
    scopes.push(scope);
    const model = scope.run(() => useTodayCalendarMemoListReadModel(today))!;
    expect(model.value.data.items[0]?.linkCount).toBe(5);
    put('calendar/workspace/2026', days, 'error');
    expect(model.value.data.items).toHaveLength(1);
    expect(model.value.flags).toEqual({ isLoading: false, isStale: true, hasError: true });
  });
});
