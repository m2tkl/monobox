import { useMemoDeletion } from './memoDeletion';
import { useMemoSaveFlow } from './memoSaveFlow';
import { useMemoMachine } from './useMemoMachine';
import { syncMemoLinks } from '../../resource/command/syncMemoLinks';

import type { DeleteMemoDialogHandle } from './deleteMemoDialog';
import type { MemoEvent } from './memoMachine';
import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';
import type { Router } from 'vue-router';

import { emitEvent } from '~/resource-runtime/infra/eventBus';

type MemoSnapshot = {
  title: string;
  content: string;
};

type UseMemoEditingMachineOptions = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  routeHash: Ref<string>;
  router: Router;
  editor: Ref<Editor | undefined>;
  memoTitle: Ref<string>;
  headImageRef: Ref<string | null | undefined>;
  deleteDialogRef: Ref<DeleteMemoDialogHandle | null>;
  getCurrentSnapshot: () => MemoSnapshot;
  onSnapshotSaved: (snapshot: MemoSnapshot) => void;
  logger: {
    debug: (message: string, payload: unknown) => void;
  };
};

export function useMemoEditingMachine(options: UseMemoEditingMachineOptions) {
  const { saveMemo } = useMemoSaveFlow();

  const memoDeletion = useMemoDeletion({
    workspaceSlug: options.workspaceSlug,
    memoSlug: options.memoSlug,
    deleteDialogRef: options.deleteDialogRef,
  });

  async function saveMemoContent(mode: 'explicit' | 'auto') {
    return saveMemo({
      target: {
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      },
      editor: options.editor.value,
      title: options.memoTitle.value,
      thumbnailImage: options.headImageRef.value ?? '',
      routeHash: options.routeHash.value,
      mode,
    });
  }

  const machine = useMemoMachine({ type: 'clean' }, {
    saveMemo: saveMemoContent,
    syncLinks: async (added, deleted) => {
      await syncMemoLinks({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      }, added, deleted);
    },
    snapshotSaved: () => {
      options.onSnapshotSaved(options.getCurrentSnapshot());
    },
    emitMemoUpdated: (memoSlug) => {
      emitEvent('memo/updated', { workspaceSlug: options.workspaceSlug.value, memoSlug });
    },
    replaceMemoRoute: (memoSlug) => {
      options.router.replace(`/${options.workspaceSlug.value}/${memoSlug}${options.routeHash.value}`);
    },
    confirmDelete: memoDeletion.confirmDelete,
    deleteMemo: memoDeletion.deleteMemo,
    emitMemoDeleted: () => {
      emitEvent('memo/deleted', { workspaceSlug: options.workspaceSlug.value });
    },
    replaceWorkspaceRoute: () => {
      options.router.replace(`/${options.workspaceSlug.value}`);
    },
  }, {
    onTransition: ({ previous, event, next, effects }) => {
      options.logger.debug('memo-machine', {
        previous: previous.type,
        event: event.type,
        next: next.type,
        effects: effects.map(effect => effect.type),
      });
    },
  });

  return {
    state: machine.state,
    dispatch: machine.dispatch,
  };
}
