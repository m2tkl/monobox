import { nextTick } from 'vue';

/**
 * Used by MemoEditing when the start intent says a blank memo should focus the
 * title field and select its current placeholder text.
 */
export function focusMemoTitleField(input: {
  focusTitleField: (selectAll?: boolean) => void;
}) {
  nextTick(() => {
    window.setTimeout(() => {
      input.focusTitleField(true);
    }, 50);
  });
}
