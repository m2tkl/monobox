import type { TabPage } from './openPages';
import type { MemoIndexItem } from '~/models/memo';

export function pickRandomMemoPage(
  memos: MemoIndexItem[],
  random: () => number = Math.random,
): TabPage | null {
  if (memos.length === 0) return null;

  const memo = memos[Math.floor(random() * memos.length)];
  return memo ? { memoSlug: memo.slug_title, title: memo.title } : null;
}
