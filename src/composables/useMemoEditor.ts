import { useEditor, type Editor as _Editor } from '@tiptap/vue-3';

import type { Extensions, Editor } from '@tiptap/core';
import type { Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';

import * as EditorAction from '~/lib/editor/action.js';
import * as CustomExtension from '~/lib/editor/extensions';
import * as EditorUtil from '~/lib/editor/util';

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
        const url = EditorAction.getLinkFromMouseClickEvent(event);

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
          return;
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
        focusHeading(editor, id);
      }

      editor.view.dom.addEventListener('click', handleLinkClick);
      return () => {
        editor.view.dom.removeEventListener('click', handleLinkClick);
      };
    },
    onTransaction: async ({ editor: _editor, transaction }) => {
      if (!transaction.docChanged) return;

      applyTargetBlankToExternalLinks(_editor);
      await updateLinks(transaction);
      updateHeadImage(transaction);
      assignUniqueHeadingIds(_editor);
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

        // If the cursor is currently inside a heading, prioritaize it.
        const { $anchor } = editor.state.selection;
        for (let depth = $anchor.depth; depth >= 0; depth--) {
          const node = $anchor.node(depth);
          if (node.type.name === 'heading') {
            activeHeadingId.value = node.attrs.id;
            return;
          }
        }

        // If the cursor is not inside a heading node, find the preceding heading.
        const { state } = editor;
        const { from } = state.selection;
        let foundHeadingId: string | null = null;
        state.doc.nodesBetween(0, from, (node) => {
          if (node.type.name === 'heading') {
            foundHeadingId = node.attrs.id ?? null;
          }
        });

        if (foundHeadingId) {
          activeHeadingId.value = foundHeadingId;
        }
      }
    },
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

  const applyTargetBlankToExternalLinks = (_editor: Editor) => {
    const { state, view } = _editor;
    const { schema, doc, tr } = state;
    const linkMarkType = schema.marks.link;

    let modified = false;

    doc.nodesBetween(0, doc.content.size, (node, pos) => {
      if (node.isText && node.marks.length > 0) {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'link') {
            const href = mark.attrs.href;
            const target = mark.attrs.target;
            if (href && !isInternalLink(href) && target !== '_blank') {
              const textLength = node.text?.length ?? 0;
              // Remove existing link mark
              tr.removeMark(pos, pos + textLength, mark.type);
              // Add new link mark with target="_blank"
              tr.addMark(
                pos,
                pos + textLength,
                linkMarkType.create({ ...mark.attrs, target: '_blank' }),
              );
              modified = true;
            }
          }
        });
      }
    });

    if (modified) {
      view.dispatch(tr);
    }
  };

  /**
   * Assigns unique IDs for heading elements in the doc.
   *
   * If a heading node does not have an `id` attribute,
   * it assigns a new unique ID.
   *
   * @param editor
   */
  const assignUniqueHeadingIds = (editor: Editor) => {
    const { state, view } = editor;
    const tr = state.tr;
    let modified = false;

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        if (!node.attrs.id) {
          const newId = crypto.randomUUID();
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: newId });
          modified = true;
        }
      }
    });

    if (modified) {
      view.dispatch(tr);
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
    wasCaretOut,
    headImageRef,
    focusHeading,
    updateActiveHeadingOnScroll,
  };
}
