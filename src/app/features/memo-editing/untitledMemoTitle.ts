export const DEFAULT_UNTITLED_MEMO_TITLE = 'Untitled';

export function buildUntitledMemoTitle(existingTitles: string[]) {
  const usedTitles = new Set(existingTitles);

  if (!usedTitles.has(DEFAULT_UNTITLED_MEMO_TITLE)) {
    return DEFAULT_UNTITLED_MEMO_TITLE;
  }

  let suffix = 2;
  while (usedTitles.has(`${DEFAULT_UNTITLED_MEMO_TITLE} ${suffix}`)) {
    suffix += 1;
  }

  return `${DEFAULT_UNTITLED_MEMO_TITLE} ${suffix}`;
}
