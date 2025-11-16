import { Editor, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, it, expect } from 'vitest';

import { convertToMarkdown } from '~/app/features/editor/serializer/markdown';

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
});
