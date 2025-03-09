import { Extension } from '@tiptap/core';

import type { EditorState } from '@tiptap/pm/state';

/**
 * Gets the start position of the current line in the editor.
 *
 * @param state - The current editor state
 * @param pos - The position within the document to find the line start
 * @returns - The block's end position
 */
const getLineStart = (state: EditorState, pos: number) => {
  const $pos = state.doc.resolve(pos);
  const blockStart = $pos.start($pos.depth);
  const textBefore = state.doc.textBetween(blockStart, pos, '\n', '\0');
  const lastNewline = textBefore.lastIndexOf('\n');
  return lastNewline === -1 ? blockStart : blockStart + lastNewline + 1;
};

/**
 * Gets the end position of the current line in the editor.
 *
 * @param state - The current editor state
 * @param pos - The position within the document to find the line end
 * @returns - The block's end position
 */
const getLineEnd = (state: EditorState, pos: number) => {
  const $pos = state.doc.resolve(pos);
  const blockEnd = $pos.end($pos.depth);
  const textAfter = state.doc.textBetween(pos, blockEnd, '\n', '\0');
  const firstNewline = textAfter.indexOf('\n');
  return firstNewline === -1 ? blockEnd : pos + firstNewline;
};

export const CustomTab = Extension.create({
  name: 'customTab',

  addKeyboardShortcuts() {
    return {
      'Tab': ({ editor }) => {
        if (editor.isActive('codeBlock')) {
          const { state, dispatch } = editor.view;
          const { selection } = state;
          const { from, to } = selection;

          // Expand the selection to the entire line
          // to prevent indentation/outdentation of the line
          // from being disabled when the selection starts in the middle.
          const textLineStart = getLineStart(state, from);
          const textLineEnd = getLineEnd(state, to);

          // Add indent from each rows
          const text = state.doc.textBetween(textLineStart, textLineEnd, '\n', '\0');
          const indentedText = text
            .split('\n')
            .map(line => '  ' + line)
            .join('\n');
          dispatch(state.tr.insertText(indentedText, textLineStart, textLineEnd));
          return true;
        }
        return false;
      },
      'Shift-Tab': ({ editor }) => {
        if (editor.isActive('codeBlock')) {
          const { state, dispatch } = editor.view;
          const { selection } = state;
          const { from, to } = selection;

          // Expand the selection to the entire line
          // to prevent indentation/outdentation of the line
          // from being disabled when the selection starts in the middle.
          const textLineStart = getLineStart(state, from);
          const textLineEnd = getLineEnd(state, to);

          // Remove indent from each rows
          const text = state.doc.textBetween(textLineStart, textLineEnd, '\n', '\0');
          const unindentedText = text
            .split('\n')
            .map((line) => {
              if (line.startsWith('  ')) {
                return line.slice(2);
              }
              return line;
            })
            .join('\n');
          dispatch(state.tr.insertText(unindentedText, textLineStart, textLineEnd));
          return true;
        }
        return false;
      },
    };
  },
});
