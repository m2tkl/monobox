import StarterKit from '@tiptap/starter-kit';
import { Editor as VueEditor } from '@tiptap/vue-3';
import { describe, it, expect } from 'vitest';

import { focusNodeById } from './focus';
import { headingExtension } from '../extensions/heading';

import type { Editor as CoreEditor } from '@tiptap/core';

describe('editor/core/focus', () => {
  it('focusNodeById moves the selection to the end of the node', () => {
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1, id: 'h1' }, content: [{ type: 'text', text: 'Title' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
        ],
      },
    }) as unknown as CoreEditor;

    let pos: number | null = null;
    let nodeSize = 0;
    editor.state.doc.descendants((node, posIndex) => {
      if (node.attrs.id === 'h1') {
        pos = posIndex;
        nodeSize = node.nodeSize;
        return false;
      }
    });

    expect(pos).not.toBeNull();

    focusNodeById(editor, 'h1');

    const expectedPos = (pos as number) + nodeSize - 1;
    expect(editor.state.selection.from).toBe(expectedPos);
    expect(editor.state.selection.to).toBe(expectedPos);
    editor.destroy();
  });
});
