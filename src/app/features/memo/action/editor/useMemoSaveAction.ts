import { useMemoSave } from './useMemoSave';

import type { Editor as TiptapEditor } from '@tiptap/core';

type SaveMemoMode = 'explicit' | 'auto';

type SaveMemoActionTarget = {
  workspaceSlug: string;
  memoSlug: string;
};

type SaveMemoActionInput = {
  target: SaveMemoActionTarget;
  editor: TiptapEditor | undefined;
  title: string;
  thumbnailImage: string;
  routeHash: string;
  mode: SaveMemoMode;
};

type SaveMemoActionResult =
  | { ok: true; memoSlug: string }
  | { ok: false; error?: unknown };

export function useMemoSaveAction() {
  const { executeMemoSave } = useMemoSave();
  const { createEffectHandler } = useEffectHandler();

  const saveMemo = async (input: SaveMemoActionInput): Promise<SaveMemoActionResult> => {
    if (!input.editor) {
      if (input.mode === 'explicit') {
        throw new Error('Editor instance not set.');
      }
      return { ok: false };
    }

    if (!input.title) {
      if (input.mode === 'explicit') {
        window.alert('Please set title.');
      }
      return { ok: false };
    }

    const handler = createEffectHandler((editor: TiptapEditor, title: string) => executeMemoSave(
      input.target,
      editor,
      title,
      input.thumbnailImage,
      input.routeHash,
    ));

    if (input.mode === 'explicit') {
      handler.withToast('Saved', 'Failed to save');
    }

    const result = await handler.execute(input.editor, input.title);
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    if (!result.data.ok) {
      return {
        ok: false,
        error: result.data.error,
      };
    }

    return {
      ok: true,
      memoSlug: result.data.data.memoSlug,
    };
  };

  return {
    saveMemo,
  };
}
