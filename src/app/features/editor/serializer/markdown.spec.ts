import { Editor, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, it, expect } from 'vitest';

import { buildExtensions, convertToMarkdown } from '~/app/features/editor';

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

  it('uses the first row as markdown header when the table has no explicit header row', () => {
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
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '1' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '2' }] }] },
              ],
            },
          ],
        },
      ],
    };
    editor.commands.setContent(content);

    const md = convertToMarkdown(editor.state.doc);
    expect(md).toContain('| A | B |');
    expect(md).toContain('| --- | --- |');
    expect(md).toContain('| 1 | 2 |');
    expect(md).not.toContain('|   |   |');
    editor.destroy();
  });
});
