import { Editor, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, it, expect } from 'vitest';

import { buildExtensions } from '~/features/editor';
import { convertToMarkdown } from '~/features/editor/serializer/markdown';

describe('serializer/markdown - convertToMarkdown', () => {
  it('serializes heading with +1 level and optional title prefix', () => {
    const editor = new Editor({ extensions: [StarterKit] });
    const content: JSONContent = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'World' }] },
      ],
    };
    editor.commands.setContent(content);

    const mdWithoutTitle = convertToMarkdown(editor.state.doc);
    expect(mdWithoutTitle).toContain('## Hello');
    expect(mdWithoutTitle).toContain('World');

    const mdWithTitle = convertToMarkdown(editor.state.doc, 'PageTitle');
    expect(mdWithTitle.startsWith('# PageTitle\n\n')).toBe(true);
    expect(mdWithTitle).toContain('## Hello');
    editor.destroy();
  });

  it('serializes code block with language fence', () => {
    const editor = new Editor({ extensions: [StarterKit] });
    const content: JSONContent = {
      type: 'doc',
      content: [
        { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const a = 1;' }] },
      ],
    };
    editor.commands.setContent(content);

    const md = convertToMarkdown(editor.state.doc);
    expect(md).toContain('```ts');
    expect(md).toContain('const a = 1;');
    expect(md).toContain('```');
    editor.destroy();
  });

  it('serializes tables as markdown tables', () => {
    const editor = new Editor({ extensions: buildExtensions({ CodeBlockComponent: {} as never }) });
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Role' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ada' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Admin' }] }] },
              ],
            },
          ],
        },
      ],
    };
    editor.commands.setContent(content);

    const md = convertToMarkdown(editor.state.doc);
    expect(md).toContain('| Name | Role |');
    expect(md).toContain('| --- | --- |');
    expect(md).toContain('| Ada | Admin |');
    editor.destroy();
  });
});
