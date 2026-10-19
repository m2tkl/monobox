import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { useLocalDate } from './useLocalDate';

afterEach(() => vi.useRealTimers());

describe('useLocalDate', () => {
  it('advances at local midnight across years and removes its timer on disposal', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59));
    const scope = effectScope();
    const date = scope.run(useLocalDate)!;
    expect(date.value).toBe('2026-12-31');
    vi.advanceTimersByTime(1000);
    expect(date.value).toBe('2027-01-01');
    scope.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('refreshes when the app resumes and stops listening on disposal', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 18));
    const scope = effectScope();
    const date = scope.run(useLocalDate)!;
    vi.setSystemTime(new Date(2026, 9, 20));
    window.dispatchEvent(new Event('focus'));
    expect(date.value).toBe('2026-10-20');
    vi.setSystemTime(new Date(2026, 9, 21));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(date.value).toBe('2026-10-21');
    scope.stop();
    vi.setSystemTime(new Date(2026, 9, 22));
    window.dispatchEvent(new Event('focus'));
    expect(date.value).toBe('2026-10-21');
  });
});
