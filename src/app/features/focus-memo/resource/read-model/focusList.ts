type FocusMemo = { slug_title: string; orderIndex: number };

// Status membership takes precedence over calendar membership.
export function buildFocusList<T extends FocusMemo>(
  statusItems: readonly T[],
  calendarItems: readonly T[],
  completions: readonly { slug_title: string; doneOn: string }[],
  date: string,
) {
  const seen = new Set<string>();
  const items: T[] = [];
  for (const item of statusItems) {
    if (seen.has(item.slug_title)) continue;
    seen.add(item.slug_title);
    items.push(item);
  }
  for (const item of calendarItems) {
    if (seen.has(item.slug_title)) continue;
    seen.add(item.slug_title);
    items.push({ ...item, orderIndex: statusItems.length + item.orderIndex });
  }
  const doneTodayMemoSlugs = new Set(
    completions.filter(item => item.doneOn === date).map(item => item.slug_title),
  );
  return {
    items,
    activeItems: items.filter(item => !doneTodayMemoSlugs.has(item.slug_title)),
    doneTodayMemoSlugs,
  };
}
