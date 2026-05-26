import {
  setLink,
  toggleHeading,
  toggleStyle,
  toggleBulletList,
  toggleOrderedList,
  toggleBlockQuote,
  toggleCode,
  insertTable,
  insertTableRowBefore,
  insertTableRowAfter,
  insertTableColumnBefore,
  insertTableColumnAfter,
  selectTableRow,
  selectTableColumn,
  deleteTableRow,
  deleteTableColumn,
  deleteEditorTable,
  unsetLink,
  unsetFileLink,
  resetStyle,
} from './action';

import type { Editor } from '@tiptap/core';

export type EditorMsg =
  | { type: 'toggleHeading'; level: 1 | 2 | 3 }
  | { type: 'toggleStyle'; style: 'bold' | 'italic' | 'strike' }
  | { type: 'toggleBulletList' }
  | { type: 'toggleOrderedList' }
  | { type: 'toggleBlockQuote' }
  | { type: 'toggleCode' }
  | { type: 'insertTable' }
  | { type: 'insertTableRowBefore' }
  | { type: 'insertTableRowAfter' }
  | { type: 'insertTableColumnBefore' }
  | { type: 'insertTableColumnAfter' }
  | { type: 'selectTableRow' }
  | { type: 'selectTableColumn' }
  | { type: 'deleteTableRow' }
  | { type: 'deleteTableColumn' }
  | { type: 'deleteTable' }
  | { type: 'clearFormat' }
  | { type: 'unsetLink' }
  | { type: 'unsetFileLink' }
  | { type: 'setLink'; href: string }
  ;

export type EditorCommandHandler<T extends EditorMsg['type']> = (
  editor: Editor,
  msg: Extract<EditorMsg, { type: T }>,
) => void;

export type EditorCommandHandlerMap = {
  [T in EditorMsg['type']]: EditorCommandHandler<T>;
};

const defaultHandlers: EditorCommandHandlerMap = {
  toggleHeading: (editor, msg) => toggleHeading(editor, { h: msg.level }),
  toggleStyle: (editor, msg) => toggleStyle(editor, msg.style),
  toggleBulletList: editor => toggleBulletList(editor),
  toggleOrderedList: editor => toggleOrderedList(editor),
  toggleBlockQuote: editor => toggleBlockQuote(editor),
  toggleCode: editor => toggleCode(editor),
  insertTable: (editor) => { insertTable(editor); },
  insertTableRowBefore: (editor) => { insertTableRowBefore(editor); },
  insertTableRowAfter: (editor) => { insertTableRowAfter(editor); },
  insertTableColumnBefore: (editor) => { insertTableColumnBefore(editor); },
  insertTableColumnAfter: (editor) => { insertTableColumnAfter(editor); },
  selectTableRow: (editor) => { selectTableRow(editor); },
  selectTableColumn: (editor) => { selectTableColumn(editor); },
  deleteTableRow: (editor) => { deleteTableRow(editor); },
  deleteTableColumn: (editor) => { deleteTableColumn(editor); },
  deleteTable: (editor) => { deleteEditorTable(editor); },
  clearFormat: editor => resetStyle(editor),
  unsetLink: editor => unsetLink(editor),
  unsetFileLink: editor => unsetFileLink(editor),
  setLink: (editor, msg) => setLink(editor, msg.href),
};

export function createEditorDispatcher(
  handlers: EditorCommandHandlerMap,
) {
  return (editor: Editor, msg: EditorMsg) => {
    const handler = handlers[msg.type] as (
      _editor: Editor,
      _msg: EditorMsg,
    ) => void;
    if (handler) {
      handler(editor, msg);
    }
  };
}

export const dispatchEditorMsg = createEditorDispatcher(defaultHandlers);
