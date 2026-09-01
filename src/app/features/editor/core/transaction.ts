import type { Transaction } from '@tiptap/pm/state';

const skipMemoDirtyMetaKey = 'monobox:skipMemoDirty';

export function markSkipMemoDirty(transaction: Transaction) {
  transaction.setMeta(skipMemoDirtyMetaKey, true);
  return transaction;
}

export function shouldSkipMemoDirty(transaction: Transaction) {
  return transaction.getMeta(skipMemoDirtyMetaKey) === true;
}
