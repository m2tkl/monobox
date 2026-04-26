import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { looksLikeMarkdown, parseMarkdownToSlice } from './markdown-paste';

import { buildExtensions } from '~/app/features/editor';

describe('editor/extensions/markdown-paste', () => {
  const createEditor = () => new Editor({
    extensions: buildExtensions({ CodeBlockComponent: {} as never }),
    content: '',
  });

  it('detects markdown-like pasted text', () => {
    expect(looksLikeMarkdown('# Title\n\n- item')).toBe(true);
    expect(looksLikeMarkdown('**bold** text')).toBe(true);
    expect(looksLikeMarkdown('just a normal sentence')).toBe(false);
  });

  it('parses markdown into tiptap-compatible nodes', () => {
    const editor = createEditor();

    const slice = parseMarkdownToSlice(
      editor.schema,
      '# Title\n\n- item\n- **done**\n\n```ts\nconst a = 1;\n```',
    );

    expect(slice.content.toJSON()).toEqual([
      {
        type: 'heading',
        attrs: { id: null, level: 1 },
        content: [{ type: 'text', text: 'Title' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }],
          },
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: 'done', marks: [{ type: 'bold' }] }],
            }],
          },
        ],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'ts', name: '', refresh: 0 },
        content: [{ type: 'text', text: 'const a = 1;' }],
      },
    ]);

    editor.destroy();
  });
});
