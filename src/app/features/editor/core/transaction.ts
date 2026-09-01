import type { Transaction } from '@tiptap/pm/state';

const editorHydrationMetaKey = 'monobox:editorHydration';

export function markEditorHydration(transaction: Transaction) {
  transaction.setMeta(editorHydrationMetaKey, true);
  return transaction;
}

export function isEditorHydration(transaction: Transaction) {
  return transaction.getMeta(editorHydrationMetaKey) === true;
}
