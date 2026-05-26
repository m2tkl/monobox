import { Editor, type JSONContent } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { serializeTableNodeToMarkdown } from './markdown';

import { buildExtensions } from '~/app/features/editor';

describe('nodeviews/Table/markdown', () => {
  it('serializes a table node to markdown without trailing whitespace', () => {
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

    const tableNode = editor.state.doc.firstChild;
    expect(tableNode).not.toBeNull();
    expect(serializeTableNodeToMarkdown(tableNode!)).toBe(`| Name | Role |
| --- | --- |
| Ada | Admin |`);

    editor.destroy();
  });
});
