import { useMemoCopy } from '../share-memo/memoCopy';

import type { ActionResult, SelectedTextCopyFormat } from './memoEditingAction';
import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';

export type UseMemoEditingClipboardActionsDeps = {
  editor: Ref<Editor | undefined>;
  memoTitle: Ref<string>;
};

export function useMemoEditingClipboardActions(options: UseMemoEditingClipboardActionsDeps) {
  const {
    copyPageAsMarkdown,
    copySelectedText,
    copyLinkToHeading,
  } = useMemoCopy();

  const exportMarkdown = (): Promise<ActionResult> | ActionResult => options.editor.value
    ? copyPageAsMarkdown(options.editor.value, options.memoTitle.value)
    : { ok: false };

  const copySelected = (format: SelectedTextCopyFormat): Promise<ActionResult> | ActionResult => options.editor.value
    ? copySelectedText(options.editor.value, format)
    : { ok: false };

  return {
    exportMarkdown,
    copySelected,
    copyLinkToHeading,
  };
}
