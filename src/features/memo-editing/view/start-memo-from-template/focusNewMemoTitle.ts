import { nextTick } from 'vue';

import { CREATED_QUERY_SOURCE_BLANK } from '../../createdQuery';

/**
 * Used by MemoEditing after opening a newly created blank memo so the title
 * field receives focus and its current placeholder text is selected.
 */
export function focusNewMemoTitle(input: {
  createdQueryValue: string | undefined;
  focusTitleField: (selectAll?: boolean) => void;
}) {
  if (input.createdQueryValue !== CREATED_QUERY_SOURCE_BLANK) {
    return;
  }

  nextTick(() => {
    window.setTimeout(() => {
      input.focusTitleField(true);
    }, 50);
  });
}
