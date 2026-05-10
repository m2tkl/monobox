import { saveMemo as executeMemoSave } from '../../resource/command/saveMemo';

import type { Editor as TiptapEditor } from '@tiptap/core';

export type MemoSaveMode = 'explicit' | 'auto';

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
  mode: MemoSaveMode;
};

export type MemoSaveResult =
  | { ok: true; memoSlug: string }
  | { ok: false; error?: unknown };

export function useMemoSaveFlow() {
  const toast = useToast();
  const logger = useConsoleLogger('memo-editing/memoSaveFlow');

  const saveMemo = async (input: SaveMemoActionInput): Promise<MemoSaveResult> => {
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

    try {
      const result = await executeMemoSave(
        input.target,
        input.editor,
        input.title,
        input.thumbnailImage,
        input.routeHash,
      );

      if (input.mode === 'explicit') {
        toast.add({ title: 'Saved', icon: iconKey.success, duration: 1000 });
      }

      return {
        ok: true,
        memoSlug: result.memoSlug,
      };
    }
    catch (error) {
      if (input.mode === 'explicit') {
        logger.error(error);
        toast.add({
          title: 'Failed to save',
          description: 'Please try again',
          color: 'error',
          icon: iconKey.failed,
        });
      }

      return {
        ok: false,
        error,
      };
    }
  };

  return {
    saveMemo,
  };
}
