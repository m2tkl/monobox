import { TextSelection, type Transaction } from '@tiptap/pm/state';
import { useEditor } from '@tiptap/vue-3';
import { CellSelection } from 'prosemirror-tables';

import type { Extensions, Editor } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';

import {
  EditorAction,
  EditorDoc,
  CustomExtension,
  EditorDom,
  EditorFocus,
  EditorSelector,
} from '~/features/editor';

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
  onChanged?: (reason: 'content') => void;
  onLinksChanged?: (added: string[], deleted: string[]) => void;

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

type TableImeGuardState = {
  cellPos: number | null;
  initialCellText: string;
  selectionFromOffset: number | null;
  selectionToOffset: number | null;
  awaitingTrailingEnter: boolean;
};

export function useMemoEditor(
  memoContent: string,
  options: MemoEditorOptions,
) {
  const enableTableImeDiagnosis = false;

  // Stores the first image found in the document, used as a thumbnail reference
  const headImageRef = ref<string>();

  // Stores the currently active heading ID, used for tracking the highlighted section in the memo
  const activeHeadingId = ref<string>();

  // Tracks whether the caret has moved out of the visible editor area, used to adjust heading focus behavior
  const wasCaretOut = ref(false);
  const createTableImeGuardState = (): TableImeGuardState => ({
    cellPos: null,
    initialCellText: '',
    selectionFromOffset: null,
    selectionToOffset: null,
    awaitingTrailingEnter: false,
  });
  const tableImeGuard = ref<TableImeGuardState>(createTableImeGuardState());

  const logTableIme = (
    stage: string,
    payload: Record<string, unknown> = {},
  ) => {
    if (!enableTableImeDiagnosis) {
      return;
    }

    const currentEditor = editor.value;
    if (!currentEditor) {
      return;
    }

    const { selection } = currentEditor.state;
    const tableDepth = selection.$from.depth >= 1
      ? selection.$from.path.findIndex((value, index) =>
          index % 3 === 0 && value?.type?.name === 'table')
      : -1;

    if (!currentEditor.isActive('table') && tableDepth === -1) {
      return;
    }

    const parent = selection.$from.parent.type.name;
    const rowOrHeader = selection.$from.node(Math.max(selection.$from.depth - 1, 0)).type.name;
    const tableNode = findAncestorNode(selection.$from, 'table');

    console.log('[table-ime]', JSON.stringify({
      stage,
      from: selection.from,
      to: selection.to,
      empty: selection.empty,
      parent,
      rowOrHeader,
      selectionType: selection.constructor.name,
      composing: currentEditor.view.composing,
      textBefore: selection.$from.parent.textContent,
      tableShape: tableNode ? summarizeTable(tableNode) : null,
      ...payload,
    }));
  };

  const findAncestorNode = (
    $pos: Editor['state']['selection']['$from'],
    typeName: string,
  ): PMNode | null => {
    for (let depth = $pos.depth; depth >= 0; depth -= 1) {
      const node = $pos.node(depth);
      if (node.type.name === typeName) {
        return node;
      }
    }

    return null;
  };

  const summarizeTable = (tableNode: PMNode) => {
    return Array.from({ length: tableNode.childCount }, (_, rowIndex) => {
      const row = tableNode.child(rowIndex);
      return Array.from({ length: row.childCount }, (_, cellIndex) => {
        const cell = row.child(cellIndex);
        return {
          type: cell.type.name,
          text: cell.textContent,
        };
      });
    });
  };

  const findAncestorNodeInfoByNames = (
    $pos: Editor['state']['selection']['$from'],
    typeNames: string[],
  ): { node: PMNode; depth: number } | null => {
    for (let depth = $pos.depth; depth >= 0; depth -= 1) {
      const node = $pos.node(depth);
      if (typeNames.includes(node.type.name)) {
        return { node, depth };
      }
    }

    return null;
  };

  const getCurrentTableCellInfo = (view: EditorView) => {
    return findAncestorNodeInfoByNames(
      view.state.selection.$from,
      ['tableCell', 'tableHeader'],
    );
  };

  const getTextOffsetWithinNode = (
    view: EditorView,
    depth: number,
    pos: number,
  ) => {
    return view.state.doc.textBetween(
      view.state.selection.$from.start(depth),
      pos,
      '\n',
      '\0',
    ).length;
  };

  const resetTableImeGuard = () => {
    tableImeGuard.value = createTableImeGuardState();
  };

  const shouldPreventTrailingTableImeEnter = (event: KeyboardEvent) => {
    return event.key === 'Enter'
      && event.keyCode === 229
      && tableImeGuard.value.awaitingTrailingEnter;
  };

  const editor = useEditor({
    content: JSON.parse(memoContent),
    extensions: options.extensions,
    editorProps: {
      // Disable browser/OS text substitutions so literal input such as `--`
      // stays unchanged inside the editor.
      attributes: {
        autocapitalize: 'off',
        autocomplete: 'off',
        autocorrect: 'off',
        spellcheck: 'false',
      },
      /**
       * Register shortcuts for the Editor.
       *
       * NOTE:
       *   Shortcuts registered here are only active when the Editor is focused.
       *   For shortcuts that should be usable even when the Editor is not focused, use `window.addEventListener` to register them.
       */
      handleKeyDown(_view: EditorView, _event: KeyboardEvent) {
        // See src/features/editor/docs/table-ime.md for the root cause.
        // macOS IME confirms inside table cells emit an Enter(keyCode=229)
        // after composition; letting it through leaves an extra empty paragraph
        // in the cell even when the composition text was already committed.
        if (
          shouldPreventTrailingTableImeEnter(_event)
        ) {
          _event.preventDefault();
          resetTableImeGuard();
          return true;
        }

        // Command register sample
        // if (event.metaKey && event.key === "i") {
        //   event.preventDefault();
        //
        //   // Do something
        //
        //   return true;
        // }
        return false;
      },
      handleClick(view, _pos, event) {
        if (!(view.state.selection instanceof CellSelection)) {
          return false;
        }

        const target = event.target as HTMLElement | null;
        if (!target?.closest('td, th')) {
          return false;
        }

        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        if (!coordinates) {
          return false;
        }

        // Row/column selection uses CellSelection, and clicking the anchor/head
        // edge cell can leave that structural selection active instead of
        // returning to a normal text caret. Force the clicked cell back to a
        // TextSelection so a single click resumes editing consistently.
        view.dispatch(
          view.state.tr.setSelection(
            TextSelection.near(view.state.doc.resolve(coordinates.pos)),
          ),
        );
        view.focus();
        return true;
      },
      handleDOMEvents: {
        compositionstart: (view, event) => {
          const target = event.target as HTMLElement | null;
          const cellInfo = getCurrentTableCellInfo(view);
          const { selection } = view.state;
          const selectionIsInsideSingleCell = cellInfo
            && selection.$from.sameParent(selection.$to)
            && selection.$from.before(cellInfo.depth) === selection.$to.before(cellInfo.depth);
          tableImeGuard.value = {
            cellPos: cellInfo ? selection.$from.before(cellInfo.depth) : null,
            initialCellText: cellInfo?.node.textContent ?? '',
            selectionFromOffset: selectionIsInsideSingleCell
              ? getTextOffsetWithinNode(view, cellInfo.depth, selection.from)
              : null,
            selectionToOffset: selectionIsInsideSingleCell
              ? getTextOffsetWithinNode(view, cellInfo.depth, selection.to)
              : null,
            awaitingTrailingEnter: false,
          };
          logTableIme('compositionstart', {
            target: target?.tagName,
            data: (event as CompositionEvent).data ?? null,
          });
          return false;
        },
        compositionupdate: (view, event) => {
          const target = event.target as HTMLElement | null;
          logTableIme('compositionupdate', {
            target: target?.tagName,
            data: (event as CompositionEvent).data ?? null,
          });
          return false;
        },
        compositionend: (view, event) => {
          const target = event.target as HTMLElement | null;
          logTableIme('compositionend', {
            target: target?.tagName,
            data: (event as CompositionEvent).data ?? null,
          });
          return false;
        },
        beforeinput: (view, event) => {
          const inputEvent = event as InputEvent;
          const target = event.target as HTMLElement | null;

          const cellInfo = getCurrentTableCellInfo(view);
          const compositionResult = inputEvent.data ?? '';
          const canResolveExpectedCellText = tableImeGuard.value.selectionFromOffset !== null
            && tableImeGuard.value.selectionToOffset !== null;
          const expectedCellTextAfterComposition = canResolveExpectedCellText
            ? [
                tableImeGuard.value.initialCellText.slice(0, tableImeGuard.value.selectionFromOffset),
                compositionResult,
                tableImeGuard.value.initialCellText.slice(tableImeGuard.value.selectionToOffset),
              ].join('')
            : null;
          if (
            inputEvent.inputType === 'insertFromComposition'
            && cellInfo
            && tableImeGuard.value.cellPos === view.state.selection.$from.before(cellInfo.depth)
            && compositionResult.length > 0
            && expectedCellTextAfterComposition !== null
            && cellInfo.node.textContent === expectedCellTextAfterComposition
          ) {
            event.preventDefault();
            // See src/features/editor/docs/table-ime.md.
            // In empty table cells, Safari/WebKit-style IME flows can apply
            // `insertCompositionText` and then replay the same content via
            // `insertFromComposition`. When that happens, ProseMirror leaves
            // an extra empty paragraph in the cell, which looks like a newline.
            // The same replay can also happen when replacing a selection inside
            // a cell. Normalize the cell back to a single paragraph and place
            // the caret after the confirmed text.
            const paragraphType = view.state.schema.nodes.paragraph;
            if (!paragraphType) {
              return false;
            }
            const cellPos = view.state.selection.$from.before(cellInfo.depth);
            const paragraphNode = paragraphType.create(
              null,
              expectedCellTextAfterComposition.length > 0
                ? view.state.schema.text(expectedCellTextAfterComposition)
                : undefined,
            );
            const normalizedCell = cellInfo.node.type.create(
              cellInfo.node.attrs,
              [paragraphNode],
              cellInfo.node.marks,
            );
            const tr = view.state.tr.replaceWith(
              cellPos,
              cellPos + cellInfo.node.nodeSize,
              normalizedCell,
            );
            const selectionPos = cellPos + 2
              + tableImeGuard.value.selectionFromOffset
              + compositionResult.length;
            view.dispatch(
              tr.setSelection(TextSelection.create(tr.doc, selectionPos)),
            );
            tableImeGuard.value.awaitingTrailingEnter = true;
            logTableIme('beforeinput-prevented', {
              target: target?.tagName,
              inputType: inputEvent.inputType ?? null,
              data: inputEvent.data ?? null,
              isComposing: inputEvent.isComposing,
              reason: 'duplicate-insertFromComposition',
            });
            return true;
          }

          logTableIme('beforeinput', {
            target: target?.tagName,
            inputType: inputEvent.inputType ?? null,
            data: inputEvent.data ?? null,
            isComposing: inputEvent.isComposing,
          });
          return false;
        },
        input: (view, event) => {
          const inputEvent = event as InputEvent;
          const target = event.target as HTMLElement | null;
          logTableIme('input', {
            target: target?.tagName,
            inputType: inputEvent.inputType ?? null,
            data: inputEvent.data ?? null,
            isComposing: inputEvent.isComposing,
          });
          return false;
        },
        keydown: (view, event) => {
          const keyboardEvent = event as KeyboardEvent;
          if (shouldPreventTrailingTableImeEnter(keyboardEvent)) {
            keyboardEvent.preventDefault();
            resetTableImeGuard();
            logTableIme('dom-keydown-prevented', {
              key: keyboardEvent.key,
              keyCode: keyboardEvent.keyCode,
              isComposing: keyboardEvent.isComposing,
              defaultPrevented: keyboardEvent.defaultPrevented,
              reason: 'table-ime-enter',
            });
            return true;
          }

          logTableIme('dom-keydown', {
            key: keyboardEvent.key,
            keyCode: keyboardEvent.keyCode,
            isComposing: keyboardEvent.isComposing,
            defaultPrevented: keyboardEvent.defaultPrevented,
          });
          return false;
        },
      },
    },
    onCreate({ editor }) {
      editor.registerPlugin(CustomExtension.removeHeadingIdOnPastePlugin);

      const handleLinkClick = async (event: MouseEvent) => {
        const url = EditorDom.getLinkFromMouseClickEvent(event);

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
        // Delay to allow editor UI to settle before focusing.
        setTimeout(() => {
          focusHeading(editor, id);
        }, 500);
      }

      editor.view.dom.addEventListener('click', handleLinkClick);
      return () => {
        editor.view.dom.removeEventListener('click', handleLinkClick);
      };
    },
    onTransaction: async ({ editor: _editor, transaction }) => {
      logTableIme('transaction', {
        docChanged: transaction.docChanged,
        steps: transaction.steps.map(step => step.constructor.name),
      });
      if (!transaction.docChanged) return;

      options.onChanged?.('content');
      EditorAction.applyTargetBlankToExternalLinks(_editor);
      const linksChanged = await updateLinks(transaction);
      if (linksChanged) {
        options.onLinksChanged?.(linksChanged.added, linksChanged.deleted);
      }
      updateHeadImage(transaction);
      EditorAction.assignUniqueHeadingIds(_editor);
    },
    onSelectionUpdate: ({ editor }) => {
      logTableIme('selectionUpdate');
      const editorContainer = document.getElementById('main');
      if (!editorContainer) return;

      const caretVisible = EditorDom.isCaretVisible(editor, editorContainer);

      if (caretVisible) {
        // When a cursor operation is performed and the cursor is visible on the screen,
        // prioritize the heading based on the cursor position
        // and set a flag to skip heading identification based on scrolling.
        wasCaretOut.value = false;

        const foundHeadingId = EditorSelector.findActiveHeadingId(editor);

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
    EditorFocus.focusNodeById(_editor, id);
    activeHeadingId.value = id;
  }

  const updateLinks = async (transaction: Transaction) => {
    const { deletedLinks, addedLinks } = EditorDoc.getChangedLinks(transaction);

    if (deletedLinks.length === 0 && addedLinks.length === 0) return null;

    return { added: addedLinks, deleted: deletedLinks };
  };

  const updateHeadImage = async (transaction: Transaction) => {
    const foundFirstImage = EditorDoc.findHeadImage(transaction);
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
    if (!EditorDom.isCaretVisible(editorInstance, editorContainer)) {
      wasCaretOut.value = true;
    }

    if (wasCaretOut.value) {
      activeHeadingId.value = EditorDom.getLastVisibleHeadingId(editorContainer);
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
