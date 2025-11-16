import { describe, it, expect } from 'vitest';

import { convertMemoToHtml, createHtmlLink } from './converters';

import type { JSONContent } from '@tiptap/vue-3';

describe('memo/export - converters', () => {
  it('convertMemoToHtml prepends h1 title then body html', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
      ],
    } as const;

    const html = convertMemoToHtml(json, 'MyTitle');
    expect(html.startsWith('<h1>MyTitle</h1>')).toBe(true);
    expect(html).toContain('<p>Body</p>');
  });

  it('createHtmlLink creates anchor tag', () => {
    const a = createHtmlLink('/path', 'Text');
    expect(a).toBe('<a href="/path">Text</a>');
  });
});
