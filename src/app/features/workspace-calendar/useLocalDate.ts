import { onScopeDispose, ref } from 'vue';

import { getLocalDateString } from './calendarUtils';

// Refresh both at midnight and when the app resumes after sleep.
export function useLocalDate() {
  const today = ref(getLocalDateString());
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    clearTimeout(timer);
    today.value = getLocalDateString();
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    timer = setTimeout(refresh, midnight.getTime() - now.getTime());
  };
  if (typeof window !== 'undefined') {
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
  }
  onScopeDispose(() => {
    clearTimeout(timer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    }
  });
  return today;
}
