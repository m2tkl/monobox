import {
  toggleHeading,
  toggleStyle,
  toggleBulletList,
  toggleOrderedList,
  toggleBlockQuote,
  toggleCode,
  resetStyle,
} from './action';

import type { EditorMsg } from './msg';
import type { Editor } from '@tiptap/vue-3';

export function dispatchEditorMsg(editor: Editor, msg: EditorMsg) {
  switch (msg.type) {
    case 'toggleHeading':
      toggleHeading(editor, { h: msg.level });
      break;
    case 'toggleStyle':
      toggleStyle(editor, msg.style);
      break;
    case 'toggleBulletList':
      toggleBulletList(editor);
      break;
    case 'toggleOrderedList':
      toggleOrderedList(editor);
      break;
    case 'toggleBlockQuote':
      toggleBlockQuote(editor);
      break;
    case 'toggleCode':
      toggleCode(editor);
      break;
    case 'clearFormat':
      resetStyle(editor);
      break;
  }
}
