import { useImagePreview } from '../compose-memo/image-preview/useImagePreview';

import type { ActionResult } from './memoEditingAction';
import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';

import { EditorAction, EditorQuery } from '~/app/features/editor';

export type UseMemoEditingEditorActionsDeps = {
  editor: Ref<Editor | undefined>;
  startImgAltEditing: () => void;
  startLinkEditing: () => void;
  openLinkPalette: (selectedText: string) => void;
};

export function useMemoEditingEditorActions(options: UseMemoEditingEditorActionsDeps) {
  const { openPreview } = useImagePreview();

  const openSelectedImagePreview = (): ActionResult => {
    const editor = options.editor.value;
    if (!editor) {
      return { ok: false };
    }

    const selection = editor.state.selection;
    const node = selection.$from?.nodeAfter ?? selection.$from?.nodeBefore;
    if (node?.type?.name !== 'image') {
      return { ok: false };
    }

    const src: string | undefined = node.attrs?.src;
    const alt: string = node.attrs?.alt || '';
    if (!src) {
      return { ok: false };
    }

    openPreview(src, alt);
    return { ok: true, data: undefined };
  };

  const openLinkPalette = (): ActionResult => {
    const selectedText = options.editor.value ? EditorQuery.getSelectedTextV2(options.editor.value.view) : '';
    options.openLinkPalette(selectedText);
    return { ok: true, data: undefined };
  };

  const unsetLink = (): ActionResult => {
    if (options.editor.value) {
      EditorAction.unsetLink(options.editor.value);
    }

    return { ok: true, data: undefined };
  };

  const toggleEditorStyle = (style: 'bold' | 'italic' | 'strike'): ActionResult => {
    if (options.editor.value) {
      EditorAction.toggleStyle(options.editor.value, style);
    }

    return { ok: true, data: undefined };
  };

  const toggleInlineCode = (): ActionResult => {
    if (options.editor.value) {
      EditorAction.toggleCode(options.editor.value);
    }

    return { ok: true, data: undefined };
  };

  const resetEditorStyle = (): ActionResult => {
    if (options.editor.value) {
      EditorAction.resetStyle(options.editor.value);
    }

    return { ok: true, data: undefined };
  };

  const startImageAltEditing = (): ActionResult => {
    options.startImgAltEditing();
    return { ok: true, data: undefined };
  };

  const startLinkEditing = (): ActionResult => {
    options.startLinkEditing();
    return { ok: true, data: undefined };
  };

  return {
    startImageAltEditing,
    openSelectedImagePreview,
    openLinkPalette,
    startLinkEditing,
    unsetLink,
    toggleEditorStyle,
    toggleInlineCode,
    resetEditorStyle,
  };
}
