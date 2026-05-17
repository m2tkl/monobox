import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { wrapInList } from 'prosemirror-schema-list';
import { describe, expect, it } from 'vitest';

import { listNormalizationExtension } from './list-normalization';

describe('listNormalizationExtension', () => {
  it('merges adjacent bullet lists that should remain a single visual list', () => {
    const editor = new Editor({
      extensions: [StarterKit, listNormalizationExtension],
      content: '',
    });

    editor.commands.setContent(`
      <ul>
        <li>
          <p>hogehoge</p>
          <ul>
            <li><p>fuafuga</p></li>
          </ul>
        </li>
        <li>
          <p>hoge</p>
          <ul>
            <li><p></p></li>
          </ul>
        </li>
      </ul>
      <ul>
        <li><p>hoge</p></li>
      </ul>
    `);

    expect(editor.getHTML()).toBe('<ul><li><p>hogehoge</p><ul><li><p>fuafuga</p></li></ul></li><li><p>hoge</p><ul><li><p></p></li></ul></li><li><p>hoge</p></li></ul>');

    editor.destroy();
  });

  it('does not merge adjacent ordered lists with different attrs', () => {
    const editor = new Editor({
      extensions: [StarterKit, listNormalizationExtension],
      content: '',
    });

    editor.commands.setContent(`
      <ol start="1">
        <li><p>one</p></li>
      </ol>
      <ol start="3">
        <li><p>three</p></li>
      </ol>
    `);

    expect(editor.getHTML()).toBe('<ol><li><p>one</p></li></ol><ol start="3"><li><p>three</p></li></ol>');

    editor.destroy();
  });

  it('preserves the selection when a paragraph after a list becomes a list item', () => {
    const editor = new Editor({
      extensions: [StarterKit, listNormalizationExtension],
      content: {
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'first' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'second' }],
          },
        ],
      },
    });

    const paragraphStartPos = editor.state.doc.child(0).nodeSize + 1;
    const selectionPos = paragraphStartPos + 2;
    editor.commands.setTextSelection(selectionPos);

    const bulletList = editor.schema.nodes.bulletList;
    const wrapped = wrapInList(bulletList)(editor.state, editor.view.dispatch);

    expect(wrapped).toBe(true);
    expect(editor.state.selection.from).toBeLessThan(editor.state.doc.content.size);
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph');
    expect(editor.state.selection.$from.parent.textContent).toBe('second');
    expect(editor.getHTML()).toBe('<ul><li><p>first</p></li><li><p>second</p></li></ul>');

    editor.destroy();
  });
});
