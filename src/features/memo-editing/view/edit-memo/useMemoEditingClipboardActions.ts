import { useMemoCopy } from '../share-memo/memoCopy';

import type { ActionResult } from './memoEditingAction';
import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';

export type UseMemoEditingClipboardActionsDeps = {
  editor: Ref<Editor | undefined>;
  memoTitle: Ref<string>;
};

export function useMemoEditingClipboardActions(options: UseMemoEditingClipboardActionsDeps) {
  const {
    copyPageAsMarkdown,
    copyPageAsHtml,
    copySelectedTextAsMarkdown,
    copyLinkToHeading,
  } = useMemoCopy();

  const copyMarkdown = (): Promise<ActionResult> | ActionResult => options.editor.value
    ? copyPageAsMarkdown(options.editor.value, options.memoTitle.value)
    : { ok: false };

  const copyHtml = (): Promise<ActionResult> | ActionResult => options.editor.value
    ? copyPageAsHtml(options.editor.value, options.memoTitle.value)
    : { ok: false };

  const copySelectedMarkdown = (): Promise<ActionResult> | ActionResult => options.editor.value
    ? copySelectedTextAsMarkdown(options.editor.value)
    : { ok: false };

  return {
    copyMarkdown,
    copyHtml,
    copySelectedMarkdown,
    copyLinkToHeading,
  };
}
