import { useEditor, type Editor as _Editor } from '@tiptap/vue-3';

import type { Extensions, Editor } from '@tiptap/core';
import type { Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';

import { EditorAction, CustomExtension, EditorQuery, EditorUtil } from '~/lib/editor';

type MemoEditorOptions = {
  /**
   * Editor extensions
   *
   * NOTE:
   *   Avoid importing Vue components directly in the TypeScript file
   *   by passing the extensions from outside.
   */
  extensions: Extensions;

  /**
   * Command callbacks
   */
  saveMemo: () => Promise<void>;
  updateLinks: (added: string[], deleted: string[]) => Promise<void>;

  /**
   * Router object for callback
   */
  route: RouteLocationNormalizedLoaded;
  router: Router;
};

type _Heading = {
  type: 'heading';
  attrs: { level: number; id: string };
  content?: Array<{ type: 'text'; text: string }>;
};

type Heading = {
  id: string;
  level: number;
  text: string;
};

export function useMemoEditor(
  memoContent: string,
  options: MemoEditorOptions,
) {
  // Stores the first image found in the document, used as a thumbnail reference
  const headImageRef = ref<string>();

  // Stores the currently active heading ID, used for tracking the highlighted section in the memo
  const activeHeadingId = ref<string>();

  // Tracks whether the caret has moved out of the visible editor area, used to adjust heading focus behavior
  const wasCaretOut = ref(false);

  const editor = useEditor({
    content: JSON.parse(memoContent),
    extensions: options.extensions,
    editorProps: {
    /**
     * Register shortcuts for the Editor.
     *
     * NOTE:
     *   Shortcuts registered here are only active when the Editor is focused.
     *   For shortcuts that should be usable even when the Editor is not focused, use `window.addEventListener` to register them.
     */
      handleKeyDown(_view: EditorView, _event: KeyboardEvent) {
      // Command register sample
      // if (event.metaKey && event.key === "i") {
      //   event.preventDefault();
      //
      //   // Do something
      //
      //   return true;
      // }
      // return false;
      },
    },
    onCreate({ editor }) {
      editor.registerPlugin(CustomExtension.removeHeadingIdOnPastePlugin);

      const handleLinkClick = async (event: MouseEvent) => {
        const url = EditorQuery.getLinkFromMouseClickEvent(event);

        // If clicked element is not link, do nothing.
        if (!url) {
          return;
        }

        // Prevent browser default navigation
        event.preventDefault();

        // If the path is same to itself and a fragment is specified, move the focus.
        const [path, id] = url.split('#');
        if (options.route.path === path) {
          focusHeading(editor, id);
        }

        if (isInternalLink(url) && !isModifierKeyPressed(event)) {
        // NOTE: Pass the entire URL instead of the path ( `{ path: url }` ) to include the fragment.
          options.router.push(url);
          return;
        }
      };

      // Focus if a hash is specified when entring the memo
      if (options.route.hash) {
        const id = options.route.hash.replace(/^#/, '');
        activeHeadingId.value = id;
      }

      editor.view.dom.addEventListener('click', handleLinkClick);
      return () => {
        editor.view.dom.removeEventListener('click', handleLinkClick);
      };
    },
    onTransaction: async ({ editor: _editor, transaction }) => {
      if (!transaction.docChanged) return;

      EditorAction.applyTargetBlankToExternalLinks(_editor);
      await updateLinks(transaction);
      updateHeadImage(transaction);
      EditorAction.assignUniqueHeadingIds(_editor);
    },
    onSelectionUpdate: ({ editor }) => {
      const editorContainer = document.getElementById('main');
      if (!editorContainer) return;

      const caretVisible = EditorUtil.isCaretVisible(editor, editorContainer);

      if (caretVisible) {
        // When a cursor operation is performed and the cursor is visible on the screen,
        // prioritize the heading based on the cursor position
        // and set a flag to skip heading identification based on scrolling.
        wasCaretOut.value = false;

        const foundHeadingId = EditorQuery.findActiveHeadingId(editor);

        if (foundHeadingId) {
          activeHeadingId.value = foundHeadingId;
        }
      }
    },
  });

  /**
   * Outline items in editor content
   */
  const outline = computed<Heading[]>(() => {
    const editorContent = editor.value?.getJSON();

    const headings = editorContent?.content?.filter(c => c.type === 'heading') as _Heading[] | undefined;
    if (headings === undefined) {
      return [];
    }

    return headings.map(h => ({
      id: h.attrs ? (h.attrs.id as string) : '',
      text: h.content ? (h.content[0].text as string) : '',
      level: h.attrs ? (h.attrs.level as number) : 1,
    }));
  });

  const activeHeading = computed<Heading | undefined>(() => {
    return outline.value.find(item => item.id === activeHeadingId.value);
  });

  /**
   * Computes the list of ancestor heading IDs for the currently active heading.
   *
   * Starting from the active heading, this function walks backwards through the list of headings,
   * collecting all headings that have a lower level (i.e., higher in the document structure).
   * It stops when it reaches the top-level heading (level 1).
   *
   * @returns An array of heading IDs representing the ancestors of the active heading,
   *          ordered from closest parent to farthest (i.e., immediate parent first).
   */
  const activeAncestorHeadings = computed<Heading[]>(() => {
    if (!activeHeadingId.value) return [];

    const index = outline.value.findIndex(item => item.id === activeHeadingId.value);
    if (index === -1) return [];

    const ancestors: Heading[] = [];
    let currentLevel = outline.value[index].level;

    for (let i = index - 1; i >= 0; i--) {
      const item = outline.value[i];
      if (item.level < currentLevel && item.id) {
        ancestors.push(item);
        currentLevel = item.level;

        if (currentLevel === 1) break;
      }
    }

    return ancestors;
  });

  /**
   * Moves the focus to a specific heading in the editor.
   *
   * This function ensures that the specified heading is scrolled into view
   * and focused within the editor.
   *
   * @param _editor - The instance of the editor. If `undefined`, the function does nothing.
   * @param id - The ID of the heading to focus on.
   */
  function focusHeading(_editor: Editor | undefined, id: string) {
    if (!_editor) {
      return;
    }

    scrollToElementWithOffset(id, 100);
    EditorUtil.focusNodeById(_editor, id);
    activeHeadingId.value = id;
  }

  const updateLinks = async (transaction: Transaction) => {
    const { deletedLinks, addedLinks } = EditorUtil.getChangedLinks(transaction);

    if (deletedLinks.length === 0 && addedLinks.length === 0) return;

    await options.updateLinks(addedLinks, deletedLinks);
    await options.saveMemo();
  };

  const updateHeadImage = async (transaction: Transaction) => {
    const foundFirstImage = EditorUtil.findHeadImage(transaction);
    if (foundFirstImage !== headImageRef.value) {
      headImageRef.value = foundFirstImage;
    }
  };

  /**
   * Updates the active heading based on the scroll position.
   * If the caret is out of view, determines the last heading that was pushed up.
   *
   * @param editorInstance - The editor instance
   * @param editorContainer - The main editor container element
   */
  function updateActiveHeadingOnScroll(editorInstance: Editor, editorContainer: HTMLElement) {
    // Set a flag to disable heading identification based on the cursor position
    // when scrolling moves the cursor out of the screen.
    if (!EditorUtil.isCaretVisible(editorInstance, editorContainer)) {
      wasCaretOut.value = true;
    }

    if (wasCaretOut.value) {
      activeHeadingId.value = EditorUtil.getLastVisibleHeadingId(editorContainer);
    }
  }

  return {
    editor,
    activeHeadingId,
    outline,
    activeHeading,
    activeAncestorHeadings,
    wasCaretOut,
    headImageRef,
    focusHeading,
    updateActiveHeadingOnScroll,
  };
}
