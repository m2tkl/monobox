import type { Editor as TiptapEditor } from '@tiptap/core';
import type { Ref } from 'vue';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import type { MemoEvent } from '~/features/memo-editing';

import { isCmdKey } from '~/utils/event';

type UseMemoEditorInteractionsOptions = {
  editor: Ref<TiptapEditor | undefined>;
  route: RouteLocationNormalizedLoaded;
  router: Router;
  dispatch: (event: MemoEvent) => void;
  focusHeading: (editor: TiptapEditor, id: string) => void;
  updateActiveHeadingOnScroll: (editor: TiptapEditor, container: HTMLElement) => void;
};

export function useMemoEditorInteractions(options: UseMemoEditorInteractionsOptions) {
  const handleKeydown = (event: KeyboardEvent) => {
    if (isCmdKey(event) && event.key === 's') {
      event.preventDefault();
      options.dispatch({ type: 'memo/save-requested', payload: { mode: 'explicit' } });
    }
  };

  const handleScroll = () => {
    const editorInstance = options.editor.value;
    const editorContainer = document.getElementById('main');
    if (!editorInstance || !editorContainer) return;

    options.updateActiveHeadingOnScroll(editorInstance, editorContainer);
  };

  const navigateToHeading = (id: string) => {
    options.router.push(`${options.route.path}#${id}`);
  };

  watch(() => options.route.hash, () => {
    if (!options.editor.value) {
      return;
    }

    if (options.route.hash) {
      const id = options.route.hash.replace(/^#/, '');
      options.focusHeading(options.editor.value, id);
    }
  });

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
    document.getElementById('main')?.addEventListener('scroll', handleScroll, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
    document.getElementById('main')?.removeEventListener('scroll', handleScroll);
  });

  return {
    navigateToHeading,
  };
}
