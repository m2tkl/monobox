import { describe, it, expect } from 'vitest';

import type { JSONContent } from '@tiptap/vue-3';

import { convertEditorJsonToHtml } from '~/app/features/editor/serializer/html';

describe('serializer/html - convertEditorJsonToHtml', () => {
  it('renders heading with +1 level (memo body rules)', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
      ],
    } as const;

    const html = convertEditorJsonToHtml(json);
    expect(html).toContain('<h2>Title</h2>');
  });

  it('renders paragraph and marks', () => {
    const json = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: '/path' } }] },
        ] },
      ],
    } as const;

    const html = convertEditorJsonToHtml(json as any);
    expect(html).toContain('<p>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<a href="/path">link</a>');
  });

  it('renders code block with language class and escapes html', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const a = 1 < 2;' }] },
      ],
    } as const;

    const html = convertEditorJsonToHtml(json);
    expect(html).toContain('<pre><code class="language-ts">');
    expect(html).toContain('1 &lt; 2;');
  });

  it('renders image with src and alt', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'http://example.com/x.png', alt: 'x' } },
      ],
    } as const;

    const html = convertEditorJsonToHtml(json);
    expect(html).toContain('<img src="http://example.com/x.png" alt="x">');
  });
});
