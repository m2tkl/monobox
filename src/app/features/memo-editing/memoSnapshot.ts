export type MemoSnapshot = {
  title: string;
  content: string;
};

export function sameMemoSnapshot(left: MemoSnapshot, right: MemoSnapshot) {
  // Titles are trimmed by persistence; surrounding whitespace is not a saved difference.
  return left.title.trim() === right.title.trim() && left.content === right.content;
}
