import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
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
});
