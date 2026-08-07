export function mergeUniqueMemoItems<T extends { slug_title: string }>(
  ...groups: ReadonlyArray<ReadonlyArray<T>>
): T[] {
  const seen = new Set<string>();
  const items: T[] = [];

  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.slug_title)) continue;
      seen.add(item.slug_title);
      items.push(item);
    }
  }

  return items;
}
