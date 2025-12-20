import {
  setLink,
  toggleHeading,
  toggleStyle,
  toggleBulletList,
  toggleOrderedList,
  toggleBlockQuote,
  toggleCode,
  unsetLink,
  resetStyle,
} from './action';

import type { Editor } from '@tiptap/vue-3';

export type EditorMsg =
  | { type: 'toggleHeading'; level: 1 | 2 | 3 }
  | { type: 'toggleStyle'; style: 'bold' | 'italic' | 'strike' }
  | { type: 'toggleBulletList' }
  | { type: 'toggleOrderedList' }
  | { type: 'toggleBlockQuote' }
  | { type: 'toggleCode' }
  | { type: 'clearFormat' }
  | { type: 'unsetLink' }
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
  clearFormat: editor => resetStyle(editor),
  unsetLink: editor => unsetLink(editor),
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
