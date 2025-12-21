import StarterKit from '@tiptap/starter-kit';
import { Editor as VueEditor } from '@tiptap/vue-3';
import { describe, it, expect } from 'vitest';

import { findActiveHeadingId } from './selector';
import { headingExtension } from '../extensions/heading';

import type { JSONContent } from '@tiptap/vue-3';

function createEditor(content: JSONContent) {
  return new VueEditor({
    extensions: [StarterKit.configure({ heading: false }), headingExtension()],
    content,
  });
}

function findNodePos(editor: VueEditor, predicate: (node: any) => boolean) {
  let foundPos: number | null = null;
  let foundNodeSize = 0;
  editor.state.doc.descendants((node, pos) => {
    if (predicate(node)) {
      foundPos = pos;
      foundNodeSize = node.nodeSize;
      return false;
    }
  });
  if (foundPos === null) {
    throw new Error('Target node not found');
  }
  return { pos: foundPos, nodeSize: foundNodeSize };
}

describe('editor/core/selector', () => {
  it('returns heading id when selection is inside a heading', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1, id: 'h1' }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
      ],
    });

    const { pos } = findNodePos(editor, node => node.attrs?.id === 'h1');
    editor.commands.setTextSelection({ from: pos + 1, to: pos + 1 });

    expect(findActiveHeadingId(editor)).toBe('h1');
    editor.destroy();
  });

  it('returns the closest heading above the current position', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1, id: 'h1' }, content: [{ type: 'text', text: 'A' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Between' }] },
        { type: 'heading', attrs: { level: 2, id: 'h2' }, content: [{ type: 'text', text: 'B' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
      ],
    });

    const { pos } = findNodePos(editor, node => node.type.name === 'paragraph' && node.textContent === 'After');
    editor.commands.setTextSelection({ from: pos + 1, to: pos + 1 });

    expect(findActiveHeadingId(editor)).toBe('h2');
    editor.destroy();
  });

  it('returns null when no heading exists above the selection', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Only paragraph' }] },
      ],
    });

    const { pos } = findNodePos(editor, node => node.type.name === 'paragraph');
    editor.commands.setTextSelection({ from: pos + 1, to: pos + 1 });

    expect(findActiveHeadingId(editor)).toBeNull();
    editor.destroy();
  });
});
